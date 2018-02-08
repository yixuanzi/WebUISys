(function(){
  $("body").prepend("<div id='wusdiv'></div>")
})();

function addinputext(callback,dtext='......',id='wusinput',btext="Start"){
     $("#wusdiv").prepend(`<textarea rows="3" cols="80" id='${id}'>${dtext}</textarea>&nbsp;&nbsp;<button id='b${id}'>${btext}</button></br>`)
     $(`#b${id}`).click(function(){
       val=$(`#${id}`).val()
       if(val==dtext){
         alert("you can input some vaild text for youself!")
         return
       }
       console.log(`get the val: "${val}" ,then and run the callback`)
       callback(val)
     })
}

/*
page=getpagewithajax("https://www.3344ui.com/xiaoshuoqu/qinggan/290384.html")
htmlobj=cheerio.parseHTML(page)
scope=cheerio("span.f16",htmlobj)
if(scope.length<=0){
  alert("have a unknow error,can't get the vaild content scope!!!")
}
contentext=getextfromtag(scope[0],2)
alert(contentext)
*/
