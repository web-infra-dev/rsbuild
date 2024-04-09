function load(key: string)  {
  import(`./test/${key}`).then(res => {
    console.log('res', res);  
  })
}

load('a');
