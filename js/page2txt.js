function getpagewithgmxhr(url,callback){
  var page;
  GM_xmlhttpRequest({
    method: 'GET',
    url: url,
    timeout:5000,
    onload: function(result) {
      page=result.responseText;
      callback(page);
    }
  });
}

function getpagewithajax(url,callback){
      $.ajax({
          url: url,
          type: "GET",
          timeout: 5000,
          success: function(data){
              callback(data);
          }
      });
}

function getpagefromURL(url,callback){
  //return getpagewithmxhr(url,callback) //monkey plugins javascript
  return getpagewithajax(url,callback) // browser plugin with ajax
}



//js 读取文件
function jsReadFiles(files,callback) {
  if (files.length) {
            var file = files[0];
            var reader = new FileReader();//new一个FileReader实例
            reader.onload = function() {
              callback(this.result)
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
  if (!tag.hasOwnProperty("children")){
    return rs
  }
  if(type==1){
    var node
    for(i in tag.children){
      node=tag.children[i]
      if (node.type =='text'){
        return node.data.replace(/(&nbsp;|\s)/g,'')
      }
    }
  }else if (type==2) {
    function processtag(ctag){
      var node
      if((!ctag.hasOwnProperty("children")) || ctag.children.length<=0){
        return
      }
      for(i in ctag.children){
        node=ctag.children[i]
        if (node.type=='text'){
          rs+=(node.data.replace(/(&nbsp;|\s)/g,' ')+"\n");
        }else{
          processtag(node)
        }
      }
    }
    processtag(tag)
  }
  return rs
}
//////////////////////////////////////////////////////////////////
function getextfromweb(models,task){
  if (!models.hasOwnProperty(task.model)){
    alert("没有正确的数据模式，请提供！")
    return
  }

  if(!task){
    alert("You must input vaild task fille!!!")
    return
  }

  printlog("A task is running......")
  var flag=false //表示是否有一个任务在执行
  var chaplist=new Array()
  var name,tag,url,rootpage,page,htmlobj,scope,contentext,name,chaperlen,prefix,chapersum,currentpage
  var filedata=new Array()
  var chaperint=task.lastchap
  var model=models[task.model]
  model.chapurl=new RegExp(model.chapurl) //covert the regexp

  function getchaplist(models,task){
      rootpage=task.rootpage.shift()
      if(!rootpage){
        if (!window.confirm(`The Online txt have ${chaplist.length} chaper,\nyou last chaper is ${task.lastchap},\nthis have ${chaplist.length-task.lastchap} chaper to update!\nAre you sure?`)) {
          return
        }
        //chaplist.length;
        if (task.hasOwnProperty('chaperlength') && task.chaperlength>0){
          chaperlen=task.chaperlength+task.lastchap
        }else{
          chaperlen=chaplist.length
        }
        chaplist=chaplist.slice(task.lastchap,chaperlen)
        //downdata2file(models,task,chaplist)
        multdowndata2file(models,task,chaplist)
      }else{
        printlog("get chaper list with: "+rootpage)
        currentpage=rootpage.split('/').slice(0,-1).join('/')
        getpagefromURL(rootpage,function(page){
          htmlobj=cheerio.parseHTML(page) //parse the html base cherrio
          scope=cheerio(model.chapscope,htmlobj) //get the chaplist scope with tag
          if(scope.length<=0){
            alert("have a unknow error,can't get the vaild content scope!!!")
            return
          }
          var alist=scope.find('a') //get the href from the scope
          for(var i=0;i<alist.length;i++){
            tag=alist[i]
            url=tag.attribs['href'].replace(/(&nbsp;|\s)/g,'')
            if (model.chapurl.test(url)){
              if(!/^https?/.test(url)){
                if(/^\//.test(url)){
                   url=model.web+url
                }else{
                  url=currentpage+'/'+url
                }
              }
              name=getextfromtag(tag)
              chaplist.push({'name':name,'url':url,'index':i})
            }
          }
          getchaplist(models,task)
        })
      }
  }

  /////
  function downdata2file(models,task,chaplist){
      var chaperinfo=chaplist.shift()
      if(chaperinfo){
        url=chaperinfo.url
        name=chaperinfo.name
        getpagefromURL(url,function(page){
          htmlobj=cheerio.parseHTML(page)
          scope=cheerio(model.content,htmlobj)
          if(scope.length<=0){
            alert("have a unknow error,can't get the vaild content scope!!!")
            return
          }
          contentext=getextfromtag(scope[0],2)
          printlog(name+':'+url+':'+page.length.toString()+':'+contentext.length.toString())

          prefix="第"+(chaperint+1).toString()+"章 "
          //contentext = nodeiconv.encode(contentext, 'utf8')
          filedata.push(prefix+name+'\n')
          filedata.push(contentext+'\n')
          chaperint++
          downdata2file(models,task,chaplist)
        })
      }else{
        printlog("download the file with blob url")
        var objblob=new Blob(filedata,{type:'application/text'})
        var downloadurl = URL.createObjectURL(objblob)

        chrome.downloads.download({url:downloadurl,filename:task.store,conflictAction:'uniquify',saveAs: true}, () => {
          window.setTimeout(() => URL.revokeObjectURL(downloadurl), 3000); //释放url对应的数据对象
        })
        //downLoad(downloadurl) //download with js
      }
  }

  /////
  function multdowndata2file(models,task,chaplist,nums=8){
      var tasklen=chaplist.length
      var startask=0
      var endtask=0

      //执行单个任务的函数
      function onedowndata2file(models,task,chaplist){
        var chaperinfo=chaplist.shift()
        if(!chaperinfo){
          return
        }
        startask++
        var url=chaperinfo.url
        var name=chaperinfo.name
        var index=chaperinfo.index
        getpagefromURL(url,function(page){
          htmlobj=cheerio.parseHTML(page)
          scope=cheerio(model.content,htmlobj)
          if(scope.length<=0){
            alert("have a unknow error,can't get the vaild content scope!!!")
            return
          }
          contentext=getextfromtag(scope[0],2)
          printlog(name+':'+url+':'+page.length.toString()+':'+contentext.length.toString())
          filedata[index]={"name":name+'\n',"text":contentext+'\n'}
          endtask++

          if(startask<tasklen){
            onedowndata2file(models,task,chaplist)
          }
          if(endtask>=tasklen && startask==endtask){
            fromdata2file()
          }
        })
      }

      //from data to file
      function fromdata2file(){
        printlog("download the file with blob url")
        var sortfiledata=new Array()
        for(var i in filedata){
          prefix="第"+(chaperint+1).toString()+"章 "
          //printlog("sort:"+prefix+filedata[i].name)
          sortfiledata.push(prefix+filedata[i].name)
          sortfiledata.push(filedata[i].text)
          chaperint++
        }

        var objblob=new Blob(sortfiledata,{type:'application/text'})
        var downloadurl = URL.createObjectURL(objblob)

        if(agentflag=="PC"){
          chrome.downloads.download({url:downloadurl,filename:task.store,conflictAction:'uniquify',saveAs: true}, () => {
            window.setTimeout(() => URL.revokeObjectURL(downloadurl), 3000); //释放url对应的数据对象
          })
        }else{
            downLoad(downloadurl) //download with js
        }
      }

      if (tasklen<nums){
        nums=tasklen
      }
      for (var i=0;i<nums;i++){
        onedowndata2file(models,task,chaplist)
      }
    }

  getchaplist(models,task)
}



//================================
function printlog(msg){
  //console.log(msg)
  $("#log").html(function(i,origText){
    return origText+"<br>"+msg
  })
}

//===================================
$(document).ready(function(){
  var ua = navigator.userAgent
  if(/Android|iPhone/i.test(ua)){
    agentflag="Mobile"
  }else{
    agentflag="PC"
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
  //file browser
  const inputElement = document.getElementById("inputfile");
  inputElement.addEventListener("change", function(){
    jsReadFiles(this.files,function(filedata){
      task=JSON.parse(filedata)
      $("#log").html("<pre>"+filedata+"</pre>")
    })
  }, false);
});
