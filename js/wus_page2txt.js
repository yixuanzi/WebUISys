
function getpagewithajax(url,asyc=false){
      var page;
      $.ajax({
          url: url,
          type: "GET",
          async: asyc,
          success: function(data){
              page=data;
          }
      });
      return page;
}


function getpagewithextension(url){
  var xhr = new XMLHttpRequest();
  var page;
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4) {
      page=xhr.responseText
    }else{
      page="FAIL"
    }
  }
  xhr.open("GET", chrome.extension.getURL(url), false);
  xhr.send();
  return page;
}

function getpagefromURL(url){
  return getpagewithextension(url);
  //return getpagewithajax(url);
}

function loadjs(jsurl){
  document.write('<script language="javascript" src="'+jsurl+'" > <\/script>');
}

//---------------------------------------------------------------------------------------------
models={'biquge':{'web':'http://www.biquge.com.tw','chapscope':'#list','chapurl':'\\d+\\.html','content':"#content"}}

document.write('</br></br>choose task file:   <input type="file" onchange="jsReadFiles(this.files)"/>')
var task;

//js 读取文件
function jsReadFiles(files) {
        if (files.length) {
            var file = files[0];
            var reader = new FileReader();//new一个FileReader实例

            reader.onload = function() {
                    $('body').append('<pre>' + this.result + '</pre>');
                    task=JSON.parse(this.result)

            }
            reader.readAsText(file);
    }
}

function downLoad(url){
    //download the file with iframe that not display
    var elemIF = document.createElement("iframe");
    elemIF.src = url;
    elemIF.style.display = "none";
    document.body.appendChild(elemIF);
}


function getextfromtag(tag,type=1){ //1:get the first text data 2:get the all of text data
  //&nbsp;
  var rs=""
  var node
  for(i in tag.children){
    node=tag.children[i]
    if (node.type=='text'){
      if(type==1){
        return node.data.replace(/(&nbsp;|\n)/g,'')
      }else if (type==2) {
        rs+=(node.data.replace(/(&nbsp;|\n)/g,' ')+"\n");
      }
    }
  }
  return rs
}

function getchaplist(models,task){
  if (models.hasOwnProperty(task.model)){
    var chaplist=new Array()
    var name,tag,url
    var model=models[task.model]
    model.chapurl=new RegExp(model.chapurl) //covert the regexp
    var page=getpagefromURL(task.rootpage) //get the page data
    var htmlobj=cheerio.parseHTML(page) //parse the html base cherrio
    var scope=cheerio(model.chapscope,htmlobj) //get the chaplist scope with tag
    var alist=scope.find('a') //get the href from the scope
    for(var i=0;i<alist.length;i++){
      tag=alist[i]
      url=tag.attribs['href']
      if (model.chapurl.test(url)){
        name=getextfromtag(tag)
        chaplist.push({'name':name,'url':url})
      }
    }
    console.log("get the chaper number is:"+chaplist.length)
    return chaplist
  }
  alert("没有正确的数据模式，请提供！")
}

function downdata2file(models,task,chaplist){
  var model=models[task.model]
  var page,htmlobj,scope,contentext,bindata
  var filedata=new Array()
  //chaplist.length;
  for(var i=task.lastchap;i<5;i++){ //update the data from lastchaper
    console.log(chaplist[i].name+':'+chaplist[i].url)
    page=getpagefromURL(chaplist[i].url)
    htmlobj=cheerio.parseHTML(page)
    scope=cheerio(model.content,htmlobj)
    contentext=getextfromtag(scope[0],2)
    //$("#p1").html("<pre>"+contentext+"</pre>");
    //bindata = nodeiconv.encode(contentext, 'utf8')
    filedata.push(contentext)
  }
  var objblob=new Blob(filedata,{type:'application/text'})
  var url = URL.createObjectURL(objblob)
  //chrome.downloads.download({url,filename:task.store,saveAs: false})
  downLoad(url)
  window.setTimeout(() => URL.revokeObjectURL(url), 10000); //释放url对应的数据对象
}

function getextfromweb(models,task){
  var chaplist=getchaplist(models,task)
  downdata2file(models,task,chaplist)
  alert("get text2file succfully")
}

// commands
document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd === 'start') {
    getextfromweb(models,task);
  }
  else if (cmd === 'close') {
    chrome.runtime.sendMessage({
      cmd: 'close-me'
    });
  }
  else if (cmd === 'restart') {
    window.location.reload();
  }
});
