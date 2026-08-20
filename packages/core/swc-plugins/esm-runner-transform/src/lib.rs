#![allow(clippy::not_unsafe_ptr_arg_deref)]

use std::collections::HashMap;

use swc_core::{
    atoms::{Atom, Wtf8Atom},
    common::{DUMMY_SP, Mark, SyntaxContext},
    ecma::{
        ast::*,
        visit::{VisitMut, VisitMutWith},
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

const IMPORT_HELPER: &str = "__rsbuild_import__";
const DYNAMIC_IMPORT_HELPER: &str = "__rsbuild_dynamic_import__";
const EXPORT_ALL_HELPER: &str = "__rsbuild_export_all__";
const EXPORT_NAME_HELPER: &str = "__rsbuild_export_name__";
const IMPORT_META_HELPER: &str = "__rsbuild_import_meta__";

#[derive(Clone)]
struct ImportBinding {
    namespace: Ident,
    imported: Option<Atom>,
}

struct ImportRequest {
    imported_names: Vec<Atom>,
    namespace: Ident,
    source: Wtf8Atom,
    export_all: bool,
}

struct TransformedEsmTransform {
    bindings: HashMap<Id, ImportBinding>,
    helper_ctxt: SyntaxContext,
    private_mark: Mark,
    request_index: usize,
}

impl TransformedEsmTransform {
    fn new(unresolved_mark: Mark) -> Self {
        Self {
            bindings: HashMap::new(),
            helper_ctxt: SyntaxContext::empty().apply_mark(unresolved_mark),
            private_mark: Mark::new(),
            request_index: 0,
        }
    }

    fn helper_ident(&self, name: &str) -> Ident {
        Ident::new(name.into(), DUMMY_SP, self.helper_ctxt)
    }

    fn private_ident(&mut self, prefix: &str) -> Ident {
        let index = self.request_index;
        self.request_index += 1;
        Ident::new(
            format!("{prefix}{index}__").into(),
            DUMMY_SP,
            SyntaxContext::empty().apply_mark(self.private_mark),
        )
    }

    fn transform_module(&mut self, mut module: Module) -> Module {
        let mut export_registrations = Vec::new();
        let mut requests = Vec::new();
        let mut body = Vec::new();

        for item in module.body {
            match item {
                ModuleItem::ModuleDecl(ModuleDecl::Import(import)) => {
                    self.assert_supported_import(&import);
                    let namespace = self.private_ident("__rsbuild_import_");
                    let mut imported_names = Vec::new();

                    for specifier in import.specifiers {
                        match specifier {
                            ImportSpecifier::Named(named) => {
                                if named.is_type_only {
                                    continue;
                                }
                                let imported = named
                                    .imported
                                    .as_ref()
                                    .map(module_export_name)
                                    .unwrap_or_else(|| named.local.sym.clone());
                                imported_names.push(imported.clone());
                                self.bindings.insert(
                                    named.local.to_id(),
                                    ImportBinding {
                                        namespace: namespace.clone(),
                                        imported: Some(imported),
                                    },
                                );
                            }
                            ImportSpecifier::Default(default) => {
                                let imported = Atom::from("default");
                                imported_names.push(imported.clone());
                                self.bindings.insert(
                                    default.local.to_id(),
                                    ImportBinding {
                                        namespace: namespace.clone(),
                                        imported: Some(imported),
                                    },
                                );
                            }
                            ImportSpecifier::Namespace(namespace_specifier) => {
                                self.bindings.insert(
                                    namespace_specifier.local.to_id(),
                                    ImportBinding {
                                        namespace: namespace.clone(),
                                        imported: None,
                                    },
                                );
                            }
                            #[cfg(swc_ast_unknown)]
                            _ => panic!("[rsbuild:runner] Unsupported import specifier"),
                        }
                    }

                    requests.push(ImportRequest {
                        imported_names,
                        namespace,
                        source: import.src.value,
                        export_all: false,
                    });
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDecl(export)) => {
                    for ident in declaration_bindings(&export.decl) {
                        export_registrations.push(
                            self.export_name_statement(
                                ident.sym.clone(),
                                Expr::Ident(ident.clone()),
                            ),
                        );
                    }
                    body.push(ModuleItem::Stmt(Stmt::Decl(export.decl)));
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportNamed(export)) => {
                    self.assert_supported_named_export(&export);
                    if let Some(source) = export.src {
                        let namespace = self.private_ident("__rsbuild_import_");
                        let mut imported_names = Vec::new();
                        for specifier in export.specifiers {
                            match specifier {
                                ExportSpecifier::Named(named) => {
                                    if named.is_type_only {
                                        continue;
                                    }
                                    let imported = module_export_name(&named.orig);
                                    let exported = named
                                        .exported
                                        .as_ref()
                                        .map(module_export_name)
                                        .unwrap_or_else(|| imported.clone());
                                    imported_names.push(imported.clone());
                                    export_registrations.push(self.export_name_statement(
                                        exported,
                                        namespace_member(&namespace, imported),
                                    ));
                                }
                                ExportSpecifier::Namespace(namespace_export) => {
                                    export_registrations.push(self.export_name_statement(
                                        module_export_name(&namespace_export.name),
                                        Expr::Ident(namespace.clone()),
                                    ));
                                }
                                ExportSpecifier::Default(default) => {
                                    let imported = Atom::from("default");
                                    imported_names.push(imported.clone());
                                    export_registrations.push(self.export_name_statement(
                                        default.exported.sym,
                                        namespace_member(&namespace, imported),
                                    ));
                                }
                                #[cfg(swc_ast_unknown)]
                                _ => panic!("[rsbuild:runner] Unsupported export specifier"),
                            }
                        }
                        requests.push(ImportRequest {
                            imported_names,
                            namespace,
                            source: source.value,
                            export_all: false,
                        });
                    } else {
                        for specifier in export.specifiers {
                            match specifier {
                                ExportSpecifier::Named(named) if !named.is_type_only => {
                                    let exported = named
                                        .exported
                                        .as_ref()
                                        .map(module_export_name)
                                        .unwrap_or_else(|| module_export_name(&named.orig));
                                    let local = match named.orig {
                                        ModuleExportName::Ident(ident) => Expr::Ident(ident),
                                        ModuleExportName::Str(_) => {
                                            panic!(
                                                "[rsbuild:runner] A local export name must be an identifier"
                                            )
                                        }
                                        #[cfg(swc_ast_unknown)]
                                        _ => {
                                            panic!("[rsbuild:runner] Unsupported local export name")
                                        }
                                    };
                                    export_registrations
                                        .push(self.export_name_statement(exported, local));
                                }
                                ExportSpecifier::Named(_) => {}
                                _ => panic!("[rsbuild:runner] Unsupported local export specifier"),
                            }
                        }
                    }
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportAll(export)) => {
                    if export.with.is_some() {
                        panic!("[rsbuild:runner] Import attributes are not supported");
                    }
                    let namespace = self.private_ident("__rsbuild_import_");
                    requests.push(ImportRequest {
                        imported_names: Vec::new(),
                        namespace,
                        source: export.src.value,
                        export_all: true,
                    });
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultDecl(export)) => {
                    match export.decl {
                        DefaultDecl::Fn(function) => {
                            let ident = function
                                .ident
                                .unwrap_or_else(|| self.private_ident("__rsbuild_default_"));
                            export_registrations.push(self.export_name_statement(
                                Atom::from("default"),
                                Expr::Ident(ident.clone()),
                            ));
                            body.push(ModuleItem::Stmt(Stmt::Decl(Decl::Fn(FnDecl {
                                ident,
                                declare: false,
                                function: function.function,
                            }))));
                        }
                        DefaultDecl::Class(class) => {
                            let ident = class
                                .ident
                                .unwrap_or_else(|| self.private_ident("__rsbuild_default_"));
                            export_registrations.push(self.export_name_statement(
                                Atom::from("default"),
                                Expr::Ident(ident.clone()),
                            ));
                            body.push(ModuleItem::Stmt(Stmt::Decl(Decl::Class(ClassDecl {
                                ident,
                                declare: false,
                                class: class.class,
                            }))));
                        }
                        DefaultDecl::TsInterfaceDecl(_) => {}
                        #[cfg(swc_ast_unknown)]
                        _ => panic!("[rsbuild:runner] Unsupported default export declaration"),
                    }
                }
                ModuleItem::ModuleDecl(ModuleDecl::ExportDefaultExpr(export)) => {
                    let ident = self.private_ident("__rsbuild_default_");
                    export_registrations.push(
                        self.export_name_statement(
                            Atom::from("default"),
                            Expr::Ident(ident.clone()),
                        ),
                    );
                    body.push(const_statement(ident, *export.expr));
                }
                ModuleItem::ModuleDecl(other) => {
                    panic!("[rsbuild:runner] Unsupported module declaration: {other:?}")
                }
                ModuleItem::Stmt(statement) => body.push(ModuleItem::Stmt(statement)),
                #[cfg(swc_ast_unknown)]
                _ => panic!("[rsbuild:runner] Unsupported module item"),
            }
        }

        let mut transformed_body = export_registrations;
        for request in requests {
            transformed_body.push(self.import_statement(&request));
            if request.export_all {
                transformed_body.push(self.export_all_statement(request.namespace));
            }
        }
        transformed_body.extend(body);

        module.body = transformed_body;
        module.visit_mut_with(&mut BindingRewriter {
            bindings: &self.bindings,
            dynamic_import_helper: self.helper_ident(DYNAMIC_IMPORT_HELPER),
            import_meta_helper: self.helper_ident(IMPORT_META_HELPER),
        });
        module
    }

    fn assert_supported_import(&self, import: &ImportDecl) {
        if import.with.is_some() {
            panic!("[rsbuild:runner] Import attributes are not supported");
        }
        if import.phase != ImportPhase::Evaluation {
            panic!("[rsbuild:runner] Import source/defer phases are not supported");
        }
    }

    fn assert_supported_named_export(&self, export: &NamedExport) {
        if export.with.is_some() {
            panic!("[rsbuild:runner] Import attributes are not supported");
        }
    }

    fn export_name_statement(&self, name: Atom, value: Expr) -> ModuleItem {
        let getter = Expr::Arrow(ArrowExpr {
            span: DUMMY_SP,
            ctxt: SyntaxContext::empty(),
            params: Vec::new(),
            body: Box::new(ArrowFunctionBody::Expr(Box::new(value))),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        });
        call_statement(
            self.helper_ident(EXPORT_NAME_HELPER),
            vec![string_expr(name), getter],
        )
    }

    fn import_statement(&self, request: &ImportRequest) -> ModuleItem {
        let mut args = vec![string_expr(
            request.source.clone().to_atom_lossy().into_owned(),
        )];
        if !request.imported_names.is_empty() {
            let names = request
                .imported_names
                .iter()
                .cloned()
                .map(|name| Some(ExprOrSpread::from(string_expr(name))))
                .collect();
            args.push(Expr::Object(ObjectLit {
                span: DUMMY_SP,
                props: vec![PropOrSpread::Prop(Box::new(Prop::KeyValue(KeyValueProp {
                    key: PropName::Ident(IdentName::new("importedNames".into(), DUMMY_SP)),
                    value: Box::new(Expr::Array(ArrayLit {
                        span: DUMMY_SP,
                        elems: names,
                    })),
                })))],
            }));
        }
        let call = call_expr(self.helper_ident(IMPORT_HELPER), args);
        const_statement(
            request.namespace.clone(),
            Expr::Await(AwaitExpr {
                span: DUMMY_SP,
                arg: Box::new(call),
            }),
        )
    }

    fn export_all_statement(&self, namespace: Ident) -> ModuleItem {
        call_statement(
            self.helper_ident(EXPORT_ALL_HELPER),
            vec![Expr::Ident(namespace)],
        )
    }
}

struct BindingRewriter<'a> {
    bindings: &'a HashMap<Id, ImportBinding>,
    dynamic_import_helper: Ident,
    import_meta_helper: Ident,
}

impl BindingRewriter<'_> {
    fn replacement(&self, ident: &Ident) -> Option<Expr> {
        let binding = self.bindings.get(&ident.to_id())?;
        Some(match &binding.imported {
            Some(imported) => namespace_member(&binding.namespace, imported.clone()),
            None => Expr::Ident(binding.namespace.clone()),
        })
    }

    fn unbound_replacement(&self, ident: &Ident) -> Option<Expr> {
        let replacement = self.replacement(ident)?;
        Some(Expr::Seq(SeqExpr {
            span: DUMMY_SP,
            exprs: vec![
                Box::new(Expr::Lit(Lit::Num(Number {
                    span: DUMMY_SP,
                    value: 0.0,
                    raw: None,
                }))),
                Box::new(replacement),
            ],
        }))
    }

    fn visit_mut_call_callee(&mut self, callee: &mut Box<Expr>) {
        if let Expr::Ident(ident) = &**callee
            && let Some(replacement) = self.unbound_replacement(ident)
        {
            **callee = replacement;
        } else {
            callee.visit_mut_with(self);
        }
    }
}

impl VisitMut for BindingRewriter<'_> {
    fn visit_mut_call_expr(&mut self, call: &mut CallExpr) {
        call.args.visit_mut_with(self);
        match &mut call.callee {
            Callee::Import(import) => {
                if import.phase != ImportPhase::Evaluation {
                    panic!("[rsbuild:runner] Dynamic import source/defer phases are not supported");
                }
                call.callee =
                    Callee::Expr(Box::new(Expr::Ident(self.dynamic_import_helper.clone())));
            }
            Callee::Expr(callee) => self.visit_mut_call_callee(callee),
            Callee::Super(_) => {}
            #[cfg(swc_ast_unknown)]
            _ => panic!("[rsbuild:runner] Unsupported call callee"),
        }
    }

    fn visit_mut_opt_call(&mut self, call: &mut OptCall) {
        call.args.visit_mut_with(self);
        self.visit_mut_call_callee(&mut call.callee);
    }

    fn visit_mut_tagged_tpl(&mut self, template: &mut TaggedTpl) {
        template.tpl.visit_mut_with(self);
        if let Expr::Ident(ident) = &*template.tag
            && let Some(replacement) = self.unbound_replacement(ident)
        {
            *template.tag = replacement;
        } else {
            template.tag.visit_mut_with(self);
        }
    }

    fn visit_mut_prop(&mut self, property: &mut Prop) {
        if let Prop::Shorthand(ident) = property
            && let Some(replacement) = self.replacement(ident)
        {
            *property = Prop::KeyValue(KeyValueProp {
                key: PropName::Ident(IdentName::new(ident.sym.clone(), ident.span)),
                value: Box::new(replacement),
            });
            return;
        }
        property.visit_mut_children_with(self);
    }

    fn visit_mut_expr(&mut self, expression: &mut Expr) {
        match expression {
            Expr::Ident(ident) => {
                if let Some(replacement) = self.replacement(ident) {
                    *expression = replacement;
                }
            }
            Expr::MetaProp(meta) if meta.kind == MetaPropKind::ImportMeta => {
                *expression = Expr::Ident(self.import_meta_helper.clone());
            }
            _ => expression.visit_mut_children_with(self),
        }
    }
}

fn module_export_name(name: &ModuleExportName) -> Atom {
    name.atom().into_owned()
}

fn declaration_bindings(declaration: &Decl) -> Vec<Ident> {
    match declaration {
        Decl::Class(class) => vec![class.ident.clone()],
        Decl::Fn(function) => vec![function.ident.clone()],
        Decl::Var(variable) => variable
            .decls
            .iter()
            .flat_map(|declaration| pattern_bindings(&declaration.name))
            .collect(),
        _ => Vec::new(),
    }
}

fn pattern_bindings(pattern: &Pat) -> Vec<Ident> {
    match pattern {
        Pat::Ident(binding) => vec![binding.id.clone()],
        Pat::Array(array) => array
            .elems
            .iter()
            .flatten()
            .flat_map(pattern_bindings)
            .collect(),
        Pat::Rest(rest) => pattern_bindings(&rest.arg),
        Pat::Object(object) => object
            .props
            .iter()
            .flat_map(|property| match property {
                ObjectPatProp::KeyValue(property) => pattern_bindings(&property.value),
                ObjectPatProp::Assign(property) => vec![property.key.id.clone()],
                ObjectPatProp::Rest(property) => pattern_bindings(&property.arg),
                #[cfg(swc_ast_unknown)]
                _ => Vec::new(),
            })
            .collect(),
        Pat::Assign(assign) => pattern_bindings(&assign.left),
        Pat::Invalid(_) | Pat::Expr(_) => Vec::new(),
        #[cfg(swc_ast_unknown)]
        _ => Vec::new(),
    }
}

fn namespace_member(namespace: &Ident, property: Atom) -> Expr {
    Expr::Member(MemberExpr {
        span: DUMMY_SP,
        obj: Box::new(Expr::Ident(namespace.clone())),
        prop: MemberProp::Computed(ComputedPropName {
            span: DUMMY_SP,
            expr: Box::new(string_expr(property)),
        }),
    })
}

fn string_expr(value: Atom) -> Expr {
    Expr::Lit(Lit::Str(Str {
        span: DUMMY_SP,
        value: value.into(),
        raw: None,
    }))
}

fn call_expr(callee: Ident, args: Vec<Expr>) -> Expr {
    Expr::Call(CallExpr {
        span: DUMMY_SP,
        ctxt: SyntaxContext::empty(),
        callee: Callee::Expr(Box::new(Expr::Ident(callee))),
        args: args.into_iter().map(ExprOrSpread::from).collect(),
        type_args: None,
    })
}

fn call_statement(callee: Ident, args: Vec<Expr>) -> ModuleItem {
    ModuleItem::Stmt(Stmt::Expr(ExprStmt {
        span: DUMMY_SP,
        expr: Box::new(call_expr(callee, args)),
    }))
}

fn const_statement(name: Ident, value: Expr) -> ModuleItem {
    ModuleItem::Stmt(Stmt::Decl(Decl::Var(Box::new(VarDecl {
        span: DUMMY_SP,
        ctxt: SyntaxContext::empty(),
        kind: VarDeclKind::Const,
        declare: false,
        decls: vec![VarDeclarator {
            span: DUMMY_SP,
            name: Pat::Ident(BindingIdent {
                id: name,
                type_ann: None,
            }),
            init: Some(Box::new(value)),
            definite: false,
        }],
    }))))
}

fn transform_program(program: Program, unresolved_mark: Mark) -> Program {
    match program {
        Program::Module(module) => {
            Program::Module(TransformedEsmTransform::new(unresolved_mark).transform_module(module))
        }
        Program::Script(_) => panic!("[rsbuild:runner] Expected an ECMAScript module"),
        #[cfg(swc_ast_unknown)]
        _ => panic!("[rsbuild:runner] Unsupported SWC program variant"),
    }
}

#[plugin_transform]
fn swc_plugin(program: Program, metadata: TransformPluginProgramMetadata) -> Program {
    transform_program(program, metadata.unresolved_mark)
}

#[cfg(test)]
mod tests {
    use swc_core::{
        common::{FileName, GLOBALS, Globals, Mark, SourceMap, sync::Lrc},
        ecma::{
            ast::Program,
            codegen::to_code_default,
            parser::{EsSyntax, Parser, StringInput, Syntax, lexer::Lexer},
            transforms::base::{fixer::fixer, hygiene::hygiene, resolver},
            visit::VisitMutWith,
        },
    };

    use super::transform_program;

    fn transform(source: &str) -> String {
        GLOBALS.set(&Globals::new(), || {
            let source_map: Lrc<SourceMap> = Default::default();
            let source_file = source_map.new_source_file(
                FileName::Custom("fixture.mjs".into()).into(),
                source.to_string(),
            );
            let lexer = Lexer::new(
                Syntax::Es(EsSyntax {
                    import_attributes: true,
                    ..Default::default()
                }),
                Default::default(),
                StringInput::from(&*source_file),
                None,
            );
            let mut parser = Parser::new_from(lexer);
            let mut program = Program::Module(parser.parse_module().expect("fixture should parse"));
            assert!(parser.take_errors().is_empty());

            let unresolved_mark = Mark::new();
            program.visit_mut_with(&mut resolver(unresolved_mark, Mark::new(), false));
            let mut program = transform_program(program, unresolved_mark);
            program.visit_mut_with(&mut hygiene());
            program.visit_mut_with(&mut fixer(None));
            to_code_default(source_map, None, &program)
        })
    }

    #[test]
    fn rewrites_import_reads_without_rewriting_shadowed_bindings() {
        let output = transform(
            r#"
        import fallback, { value as remote } from 'dependency';
        import * as namespace from 'namespace';
        import 'side-effect';
        const __rsbuild_import__ = 'user binding';
        export const direct = remote;
        export const defaultValue = fallback;
        export const ns = namespace;
        export const shadowed = (remote) => ({ remote });
        export { __rsbuild_import__ as helperCollision };
      "#,
        );

        assert_eq!(
            output,
            r#"__rsbuild_export_name__("direct", ()=>direct);
__rsbuild_export_name__("defaultValue", ()=>defaultValue);
__rsbuild_export_name__("ns", ()=>ns);
__rsbuild_export_name__("shadowed", ()=>shadowed);
__rsbuild_export_name__("helperCollision", ()=>__rsbuild_import__1);
const __rsbuild_import_0__ = await __rsbuild_import__("dependency", {
    importedNames: [
        "default",
        "value"
    ]
});
const __rsbuild_import_1__ = await __rsbuild_import__("namespace");
const __rsbuild_import_2__ = await __rsbuild_import__("side-effect");
const __rsbuild_import__1 = 'user binding';
const direct = __rsbuild_import_0__["value"];
const defaultValue = __rsbuild_import_0__["default"];
const ns = __rsbuild_import_1__;
const shadowed = (remote)=>({
        remote
    });
"#
        );
    }

    #[test]
    fn preserves_object_shorthand_destructuring_class_and_unbound_calls() {
        let output = transform(
            r#"
        import { Base, call, tag, value } from 'dependency';
        const { local } = { local: 1 };
        export class Child extends Base {}
        export const object = { value, local };
        export const result = call();
        export const optionalResult = call?.();
        export const tagged = tag`value`;
      "#,
        );

        assert_eq!(
            output,
            r#"__rsbuild_export_name__("Child", ()=>Child);
__rsbuild_export_name__("object", ()=>object);
__rsbuild_export_name__("result", ()=>result);
__rsbuild_export_name__("optionalResult", ()=>optionalResult);
__rsbuild_export_name__("tagged", ()=>tagged);
const __rsbuild_import_0__ = await __rsbuild_import__("dependency", {
    importedNames: [
        "Base",
        "call",
        "tag",
        "value"
    ]
});
const { local } = {
    local: 1
};
class Child extends __rsbuild_import_0__["Base"] {
}
const object = {
    value: __rsbuild_import_0__["value"],
    local
};
const result = (0, __rsbuild_import_0__["call"])();
const optionalResult = (0, __rsbuild_import_0__["call"])?.();
const tagged = (0, __rsbuild_import_0__["tag"])`value`;
"#
        );
    }

    #[test]
    fn rewrites_exports_reexports_dynamic_import_and_import_meta() {
        let output = transform(
            r#"
        export const local = 1;
        export { local as "string name" };
        export default function named() {}
        export { value as renamed, default as otherDefault } from 'dependency';
        export * from 'star';
        export * as namespace from 'namespace';
        export const dynamic = () => import('./lazy.mjs');
        export const meta = import.meta.url;
      "#,
        );

        assert_eq!(
            output,
            r#"__rsbuild_export_name__("local", ()=>local);
__rsbuild_export_name__("string name", ()=>local);
__rsbuild_export_name__("default", ()=>named);
__rsbuild_export_name__("renamed", ()=>__rsbuild_import_0__["value"]);
__rsbuild_export_name__("otherDefault", ()=>__rsbuild_import_0__["default"]);
__rsbuild_export_name__("namespace", ()=>__rsbuild_import_2__);
__rsbuild_export_name__("dynamic", ()=>dynamic);
__rsbuild_export_name__("meta", ()=>meta);
const __rsbuild_import_0__ = await __rsbuild_import__("dependency", {
    importedNames: [
        "value",
        "default"
    ]
});
const __rsbuild_import_1__ = await __rsbuild_import__("star");
__rsbuild_export_all__(__rsbuild_import_1__);
const __rsbuild_import_2__ = await __rsbuild_import__("namespace");
const local = 1;
function named() {}
const dynamic = ()=>__rsbuild_dynamic_import__('./lazy.mjs');
const meta = __rsbuild_import_meta__.url;
"#
        );
    }

    #[test]
    #[should_panic(expected = "Import attributes are not supported")]
    fn rejects_import_attributes() {
        transform("import value from 'dependency' with { type: 'json' }; void value;");
    }
}
