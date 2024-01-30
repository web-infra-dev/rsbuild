function logged() {
  window.bbb = 'world';
}

class C {
  message = 'hello!';

  @logged
  m() {
    return this.message;
  }
}

window.aaa = new C().m();
