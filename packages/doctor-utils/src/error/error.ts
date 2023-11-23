import { codeFrameColumns } from '@babel/code-frame';
import { Err, Rule } from '@rsbuild/doctor-types';
import { Chalk, Instance } from 'chalk';
import deepEql from 'deep-eql';
import { isNil } from 'lodash';
import stripAnsi from 'strip-ansi';
import { transform } from './transform';
import { insertSpace, toLevel } from './utils';

let id = 1;

export class DevToolError extends Error implements Err.DevToolErrorInstance {
  static from(err: unknown, opt?: Err.DevToolErrorParams): DevToolError {
    if (err instanceof DevToolError) {
      return err;
    }

    return transform(err, opt);
  }

  readonly id: number;

  readonly code?: string;

  readonly category?: string;

  readonly title: string;

  readonly detail?: any;

  readonly fixData?: Err.FixData;

  readonly hint?: string;

  readonly referenceUrl?: string;

  private _codeFrame?: Err.CodeFrameOption;

  private _controller: Err.ControllerOption = {
    noStack: true,
    noColor: false,
  };

  private readonly _level: Err.ErrorLevel;

  constructor(title: string, message: string, opts?: Err.DevToolErrorParams) {
    super(message);
    this.id = id++;
    this.title = title;
    this.code = opts?.code;
    this.hint = opts?.hint;
    this.stack = opts?.stack;
    this.detail = opts?.detail;
    this.fixData = opts?.fixData;
    this.category = opts?.category;
    this.referenceUrl = opts?.referenceUrl;
    this._level = opts?.level ? toLevel(opts.level) : Err.ErrorLevel.Error;
    this._codeFrame = opts?.codeFrame;

    this.setControllerOption(opts?.controller ?? {});
  }

  get level() {
    return Err.ErrorLevel[this._level] as keyof typeof Err.ErrorLevel;
  }

  get path() {
    return this._codeFrame?.filePath;
  }

  set path(file: string | undefined) {
    if (!file) {
      return;
    }

    if (this._codeFrame) {
      this._codeFrame.filePath = file;
      return;
    }

    this._codeFrame = {
      filePath: file,
    };
  }

  get codeFrame() {
    return this._codeFrame;
  }

  private printCodeFrame(print: Chalk) {
    const msgs: string[] = [];
    const { _codeFrame: codeFrameOpt, _controller: controller } = this;

    if (!codeFrameOpt) {
      return msgs;
    }

    // If the starting point exists, the file path and the codes will be printed.
    if ('start' in codeFrameOpt && codeFrameOpt.start) {
      const { filePath, start } = codeFrameOpt;

      msgs.push(
        `\n ${print.red(print.bold('File: '))}${print.bold(filePath)}:${
          start.line
        }${start.column ? `:${start.column}` : ''}`,
      );

      if ('fileContent' in codeFrameOpt) {
        const { end, fileContent } = codeFrameOpt;

        msgs.push(
          codeFrameColumns(
            fileContent,
            {
              start,
              end,
            },
            {
              highlightCode: !controller.noColor,
            },
          ),
        );
      } else if ('lineText' in codeFrameOpt) {
        const { length, lineText } = codeFrameOpt;
        let lineCodeFrame = codeFrameColumns(
          lineText,
          {
            start: {
              line: 1,
              column: start.column,
            },
            end: {
              line: 1,
              column:
                isNil(start.column) || isNil(length)
                  ? undefined
                  : start.column + length,
            },
          },
          {
            highlightCode: !controller.noColor,
          },
        );

        if (start.line > 1) {
          lineCodeFrame = lineCodeFrame.replace(' 1 |', ` ${start.line} |`);

          if (start.line >= 10) {
            lineCodeFrame = insertSpace(
              lineCodeFrame,
              2,
              String(start.line).length - 1,
            );
          }
        }

        msgs.push(lineCodeFrame);
      }
    }
    // If the starting point does not exist, only the file path will be printed.
    else {
      msgs.push(
        `\n ${print.red(print.bold('File: '))}${print.bold(
          codeFrameOpt.filePath,
        )}\n`,
      );
    }

    return msgs;
  }

  toString() {
    const msgs: string[] = [];
    const {
      code,
      title,
      message,
      hint,
      referenceUrl,
      _controller: controller,
    } = this;
    const print = controller.noColor
      ? new Instance({ level: 0 })
      : new Instance({ level: 3 });
    const mainColorPrint =
      this._level === Err.ErrorLevel.Error ? print.red : print.yellow;
    const codeText = code ? `${mainColorPrint.blue(code)}:` : '';

    msgs.push(
      mainColorPrint.bold(
        `[${codeText}${this.level}:${title.toUpperCase()}] `,
      ) + message,
    );
    msgs.push(...this.printCodeFrame(print));

    if (hint || referenceUrl) {
      msgs.push('');
    }

    if (hint) {
      msgs.push(` ${print.blue(`HINT: ${hint}`)}`);
    }

    if (referenceUrl) {
      msgs.push(print.magenta.bold(` See: ${referenceUrl}`));
    }

    if (!controller.noStack && this.stack) {
      msgs.push(print.red.bold(` Error Stack:\n${this.stack}\n`));
    }

    return msgs.join('\n');
  }

  toData(): Rule.RuleStoreDataItem {
    return {
      ...this.detail,
      id: this.id,
      category: this.category,
      description: stripAnsi(this.detail?.description ?? this.message),
      title: this.title.toUpperCase(),
      code: this.code,
      level: this.level.toLowerCase(),
    };
  }

  toError() {
    const error = new Error();

    error.message = this.toString();
    error.name = this.name;
    error.stack = this.stack;

    return error;
  }

  /**
   * for json stringify
   */
  toJSON() {
    return {
      message: this.toString(),
      name: this.name,
      stack: this.stack,
    };
  }

  setControllerOption(opt: Err.ControllerOption) {
    this._controller = {
      noStack: opt.noStack ?? this._controller.noStack ?? true,
      noColor: opt.noColor ?? this._controller.noColor ?? false,
    };
  }

  setCodeFrame(opt: Err.CodeFrameOption) {
    this._codeFrame = opt;
  }

  isSame(error: Err.DevToolErrorInstance) {
    return (
      this.code === error.code &&
      this.message === error.message &&
      this.hint === error.hint &&
      this.level === error.level &&
      this.title === error.title &&
      this.referenceUrl === error.referenceUrl &&
      this.code === error.code &&
      deepEql(this.codeFrame, error.codeFrame)
    );
  }
}
