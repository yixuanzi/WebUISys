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

function getpagewithxhr(url,asyc=false){
  var xhr = new XMLHttpRequest();
  var page;
  xhr.onreadystatechange = function(){
    if (xhr.readyState == 4) {
      page=xhr.responseText
    }else{
      page="FAIL"
    }
  }
  //chrome.extension.getURL(url)
  xhr.open("GET", url, asyc);

  if(task.hasOwnProperty('encode')){
    xhr.setRequestHeader("Content-type","application/html; charset="+task.encode);
  }
  xhr.send();
  return page;
}

var ua = navigator.userAgent.toLowerCase();
if (/firefox/.test(ua)) {
    uatype=1
}else if (/chrome/.test(ua)) {
    uatype=2
}

function getpagefromURL(url){
  if (uatype==1) {
      return getpagewithxhr(url) //firefox在扩展中貌似对ajax跨域请求不支持，只能暂时使用xhr，且在firefox存在编码问题
  }else if (uatype==2) {
      return getpagewithajax(url) //chrome 中各种正常
  }
}

function loadjs(jsurl){
  document.write('<script language="javascript" src="'+jsurl+'" > <\/script>');
}



//---------------------------------------------------------------------------------------------
models={'biquge':{'web':'http://www.biquge.com.tw','chapscope':'#list','chapurl':'\\d+\\.html','content':"#content"},
        'biquge2':{'web':'http://www.biquge.cm','chapscope':'#list','chapurl':'\\d+\\.html','content':"#content"},
        '3344ui':{'web':'https://www.3344ui.com','chapscope':'ul.news_list','chapurl':'\\d+\\.html','content':"div.news"}}

//task={"model":"biquge","rootpage":"list.html","store":"魔教.txt","lastchap":5,"chaperlength":5,'encode':'gbk'}
task=null
flag=false //表示是否有一个任务在执行
//js 读取文件
function jsReadFiles() {
  files=this.files
        if (files.length) {
            var file = files[0];
            var reader = new FileReader();//new一个FileReader实例

            reader.onload = function() {
                    $("#jstxt").html("task config:</br><pre>" + this.result + '</pre>');
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
  if (!tag.hasOwnProperty("children")){
    return rs
  }
  for(i in tag.children){
    node=tag.children[i]
    if (node.type=='text'){
      if(type==1){
        return node.data.replace(/(&nbsp;|\s)/g,'')
      }else if (type==2) {
        rs+=(node.data.replace(/(&nbsp;|\s)/g,' ')+"\n");
      }
    }
  }
  return rs
}

function getchaplist(models,task){
  if (models.hasOwnProperty(task.model)){
    var chaplist=new Array()
    var name,tag,url,rootpage
    var model=models[task.model]
    model.chapurl=new RegExp(model.chapurl) //covert the regexp
    for (var i in task.rootpage){ //支持多个rootpage页面同时下载，但是结果会下载到一个文件中
      rootpage=task.rootpage[i]
      var page=getpagefromURL(rootpage) //get the page data
      var htmlobj=cheerio.parseHTML(page) //parse the html base cherrio
      var scope=cheerio(model.chapscope,htmlobj) //get the chaplist scope with tag
      if(scope.length<=0){
        alert("have a unknow error,can't get the vaild content scope!!!")
        return
      }
      var alist=scope.find('a') //get the href from the scope
      for(var i=0;i<alist.length;i++){
        tag=alist[i]
        url=tag.attribs['href']
        if (model.chapurl.test(url)){
          name=getextfromtag(tag)
          chaplist.push({'name':name,'url':url})
        }
      }
    }

    //console.log("get the chaper number is:"+chaplist.length)
    //if(uatype==2){
    //    alert("get the chapers number is:"+chaplist.length)
    //}
    return chaplist
  }
  alert("没有正确的数据模式，请提供！")
}

function downdata2file(models,task,chaplist){
  if (!window.confirm(`The Online txt have ${chaplist.length} chaper,\nyou last chaper is ${task.lastchap},\nthis have ${chaplist.length-task.lastchap} chaper to update!\nAre you sure?`)) {
    return
  }
  var model=models[task.model]
  var page,htmlobj,scope,contentext,name,chaperlen,prefix,chapersum
  var filedata=new Array()
  //chaplist.length;
  if (task.hasOwnProperty('chaperlength') && task.chaperlength>0){
    chaperlen=task.chaperlength+task.lastchap
  }else{
    chaperlen=chaplist.length
  }

  for(var i=task.lastchap;i<chaperlen;i++){ //update the data from lastchaper
    url=chaplist[i].url
    if (!/^https?:/.test(url)){
      url=model.web+url
    }
    console.log(chaplist[i].name+':'+url)
    page=getpagefromURL(url)
    htmlobj=cheerio.parseHTML(page)
    scope=cheerio(model.content,htmlobj)
    if(scope.length<=0){
      alert("have a unknow error,can't get the vaild content scope!!!")
      return
    }
    name=chaplist[i].name
    contentext=getextfromtag(scope[0],2)
    prefix="第"+(i+1).toString()+"章 "
    //contentext = nodeiconv.encode(contentext, 'utf8')
    filedata.push(prefix+name+'\n')
    filedata.push(contentext+'\n')
  }
  var objblob=new Blob(filedata,{type:'application/text'})
  var downloadurl = URL.createObjectURL(objblob)
  chrome.downloads.download({url:downloadurl,filename:task.store,conflictAction:'uniquify',saveAs: true}, () => {
    window.setTimeout(() => URL.revokeObjectURL(downloadurl), 3000); //释放url对应的数据对象
  })
  //downLoad(downloadurl)

}

function getextfromweb(models,task){
  if(flag){
    return
  }
  if (task!=null){
    flag=true
    var chaplist=getchaplist(models,task)
    if (chaplist){
        downdata2file(models,task,chaplist)
    }
    flag=false
  }else{
    alert("You must input vaild task fille!!!")
  }
}

//==============================================================================
$(document).ready(function(){
  $("#bget").click(function(){
    pagedata=getpagefromURL("list.html");
    $("#p1").html(pagedata);
  });
  $("#balert").click(function(){
    alert(document.domain)
  });
  $("#bshow").click(function(){
    $("#p1").show()
  });
  $("#bhide").click(function(){
    $("#p1").hide()
  });

  const inputElement = document.getElementById("inputfile");
  inputElement.addEventListener("change", jsReadFiles, false);

});

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
//document.write('</br></br>choose task file:   <input type="file" onchange="jsReadFiles(this.files)"/>')
