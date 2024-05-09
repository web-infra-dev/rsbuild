function case1() {
  const script = document.createElement('script');
  script.src = '/test-query?a=1&b=1';
  document.head.appendChild(script);
}

function case2() {
  const script = document.createElement('script');
  script.src = '/test-query-hash?a=1&b=1#title';
  document.head.appendChild(script);
}

case1();
case2();
