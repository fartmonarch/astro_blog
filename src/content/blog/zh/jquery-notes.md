---
title: "jQuery学习笔记"
description: "记录当时学jQuery的笔记"
pubDate: "2025-07-04T09:09"
tags: ["总结", "学习笔记"]
---

## **jQuery基础**

### **学习jQuery的必要性**

1. 各大网站还在应用（京东、百度）
2. 一些广告页面、落地页还在应用
3. 源码非常优秀，有助于理解JavaScript
4. 其实对DOM操作并不能完全移除，只要涉及到DOM操作，jQuery是非常方便的

### **体验jQuery**

```js
$('#name').html("Hello 体验 jQuery")
//等同于 var name = document.getElementbyId("name");
//      name.innerHTML = "Hello 体验 jQuery";
```

### **基础选择器**

```js
// $就是jQuery的缩写，他就代表了jQuery

    // 类选择器
    $(".box").html("jQuery类选择器")
    // 元素选择器
    $("span").html("jQuery元素选择器")
    // ID选择器(具有唯一性)
    $("#it").html("jQuery ID选择器")


```

### **子代选择器**

```js
//使用原生js来写的话
1. 给所有ul标签下的li标签添加一个边框（直接子元素）
topnav=document.getElementsByClassName("topnav")[0];
// 读取到topnav下面所有的子元素
var children = topnav.childNodes;
for(var i = 0;i<children.length;i++){
	if(children[i].nodeName !== "#text"){
   		children[i].style.border = "3px solid green"
    }
}

// jQuery子元素
// .css(样式属性，样式属性值)
$(".topnav > li").css("border","3px solid red")
```

### **后代选择器**

```
// 2. 给所有ul标签下的li标签添加一个边框（后代元素）
var topnav = document.getElementsByClassName("topnav")[0];
var children = topnav.getElementsByTagName("li");
for(var i = 0;i<children.length;i++){
   children[i].style.border = "3px solid green"
}

// jQuery后代元素选择器
$(".topnav li").css("border","3px solid red")
```



### **属性选择器（一）**

```html
//完美匹配
	$('input[value="name"]').next().html("username");

//前缀匹配（完美匹配或者加上连字符(-)）
//例子
<body>
  <a href="#" alt="sxt">尚学堂</a>
  <a href="#" alt="sxt-web">尚学堂-前端</a>
  <a href="#" alt="sxtitbaizhan">itbaizhan</a>
  <script>
    $('a[alt|="sxt"]').css('border', '3px solid green');
	//前面两个匹配上了
  </script>
</body>

//部分匹配(包含)
<body>
  <input name="sxt-itbaizhan" />  
  <input name="sxtweb" />
  <input name="bjsxtweb" />
  <input name="itbaizhan" />
  <script>
      $('input[name*="sxt"]').val('study!');
      //前三个被选择了
    </script>
</body>
```

### **属性选择器（二）**

```html
//Attribute Selector [name~="value"]
//选择指定属性用空格分隔的值中包含一个给定值的元素 空格隔开匹配
<body>
  <input name="sxt-itbaizhan" />  
  <input name="sxt web" />
  <input name="bjsxtweb" />
  <script>$('input[name~="sxt"]').val('study!');</script>
   //只有第二个匹配
</body>

//Attribute Selector [name$="value"]
//选择指定属性是以给定值结尾的元素。这个比较是区分大小写的 结尾匹配
<body>
  <input name="sxt-itbaizhan" />  
  <input name="sxt web" />
  <input name="bjsxtweb" />
  <script>$('input[name$="web"]').val('study!');</script>
    //第二个和第三个匹配
</body>

Attribute Selector [name^="value"]
选择指定属性是以给定字符串开始的元素  开头匹配
<body>
  <input name="sxt-itbaizhan" />  
  <input name="sxt web" />
  <input name="bjsxtweb" />
  <script>$('input[name^="sxt"]').val('study!');</script>
    //第一个和第二个匹配
</body>

```

### **jQuery选择器(一)**

```html
// :eq(index) index:从0开始
// 建议使用 .eq(index)性能更好 $("li").eq(2).css("border","2px solid red")
<body>
  <ul class="nav">
    <li>List 1, item 1</li>
    <li>List 1, item 2</li>
    <li>List 1, item 3</li>
  </ul>
  <script>
    $("li:eq(2)").css("border","2px solid red")
  </script>
    //第三个匹配到
</body>


// :even 偶数选择器 从下标为0开始
// :odd 奇数选择器 从下标为0开始
这两个不举例了
```

### **jQuery选择器(二)**

```html
// :first Selector
// 选择第一个匹配的元素
<body>
  <table border="1">
    <tr>
      <td>Row 1</td>
    </tr>
    <tr>
      <td>Row 2</td>
    </tr>
    <tr>
      <td>Row 3</td>
    </tr>
  </table>
  <script>$("tr:first").css("background-color", "red");</script>
    //语义化理解 只有第一个符合
</body>


//:last Selector
//选择最后一个匹配的元素
<body>
  <table border="1">
    <tr>
      <td>Row 1</td>
    </tr>
    <tr>
      <td>Row 2</td>
    </tr>
    <tr>
      <td>Row 3</td>
    </tr>
  </table>
  <script>$("tr:last").css("background-color", "red");</script>
    //语义化理解 只有最后一个符合
</body>


:gt(index) Selector
选择匹配集合中所有大于给定index（索引值）的元素。
<body>
  <table border="1">
    <tr>
      <td>TD #0</td>
      <td>TD #1</td>
      <td>TD #2</td>
    </tr>
    <tr>
      <td>TD #3</td>
      <td>TD #4</td>
      <td>TD #5</td>
    </tr>
    <tr>
      <td>TD #6</td>
      <td>TD #7</td>
      <td>TD #8</td>
    </tr>
  </table>
  <script>
    $("td:gt(4)").css("backgroundColor", "yellow");
  </script>
    //5、6、7、8都匹配上了
</body>


//:lt(index) Selector
//选择匹配集合中所有索引值小于给定index参数的元素
//举例省略了
```

### **DOM操作(一)**

**Class操作 addClass() removeClass() toggleClass() hasClass()**

- ### addClass()

  给元素添加class，值得注意的是这个方法不会替换一个样式类名。它只是简单的添加一个样式类名到元素上

  ```html
  $("p").addClass("myClass");
  ```

  也可以同时添加多个class

  ```html
  $("p").addClass("myClass1 myClass2");
  ```

  

- ### removeClass()

  移除元素中每个匹配元素上一个，多个或全部样式

  通过class名字移除元素

  ```
  $('p').removeClass('myClass yourClass')
  ```

  移除全部class

  ```
  $('p').removeClass()
  ```

  配合addClass() 一起使用用来切换元素的样式

  ```html
  $('p').removeClass('myClass noClass').addClass('yourClass');
  ```

- ### toggleClass()

  这是一个开关方法，如果class存在则删除，如果class不存在则添加

  ```
  $('#foo').toggleClass(className, addOrRemove);
  ```

- ### hasClass()

  判断一个元素上是否具有某个class

  ```
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <title>gt demo</title>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <div id="mydiv" class="foo bar"></div>
    <script>
      var flag = $('#mydiv').hasClass('foo')
      if(flag){
        $('#mydiv').html("div具有foo class")
       }
    </script>
  </body>
  </html>
  ```

### **DOM操作(二)**

​	**文本操作 html() text() val()**

​	**属性操作 attr() removeAttr()**

- ### html()

​		获取元素中的HTML内容

​			`$('div.demo-container').html();`

​	html()方法还可以设置元素的html内容

​			`$('div.demo-container').html('<p>All new content. <em>You bet!</em></p>');`

- ### text()

  获取元素中的内容但是直接读成字符串 识别不了html内容

  ```
  //与上面html()出来内容相同
  $('div.demo-container').text();
  
  
  //元素内直接设置字符串"<p>All new content. <em>You bet!</em></p>"
  $('div.demo-container').html('<p>All new content. <em>You bet!</em></p>');
  ```

  

- ### val()

​	用于获取`<input>`标签中的内容

```
$(".input").val();
```

​	也可以设置`<input>`标签内容

```
$(".input").val("username")
```

- ### attr()

​	获取匹配的元素的属性的值 或 设置匹配元素的一个或多个属性

```
<!DOCTYPE html>
<html>
<head>
  <style>
    img {
      padding: 10px;
      width: 100px;
     }
    div {
      color: red;
      font-size: 24px;
     }
  </style>
  <script src="./js/jquery-3.6.0.min.js"></script>
</head>
<body>
  <img />
  <div><B>Attribute of Ajax</B></div>
  <script>
    $("img").attr({
      src: "https://www.itbaizhan.com/wiki/images/1.jpeg",
      title: "jQuery",
      alt: "jQuery Logo"
     });
    $("div").text($("img").attr("alt"));
  </script>
</body>
</html>
```

- ### removeAttr()

​	为匹配的元素集合中的每个元素中移除一个属性（attribute）	

```
img.removeAttr("title")
```

### **DOM操作(三)**

​	**DOM 插入并包裹现有内容**

- **.wrap()**
- **.unwrap()**
- **.wrapAll()**
- **.wrapInner()**



- #### .wrap()

  在每个匹配的元素外层包上一个html元素

  ```
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>itbaizhan</p>
    <script>
      $("p").wrap("<div class='container'></div>");
    </script>
  </body>
  </html>
  ```

- #### .unwrap()

  将匹配元素集合的父级元素删除，保留自身在原来的位置

  ```
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <div>
      <p>itbaizhan</p>
    </div>
    <script>
      $("p").unwrap();
    </script>
  </body>
  </html>
  ```

- #### .wrapAll()

  在所有匹配元素外面包一层HTML结构

  ```
  <!DOCTYPE html>
  <html>
  <head>
   <style>
    div { border: 2px solid blue; }
    p { background:yellow; margin:4px; }
   </style>
   <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>itbaizhan</p>
    <p>sxt</p>
    <p>web</p>
    <script>
      $("p").wrapAll("<div></div>");
    </script>
  </body>
  ```

- #### .wrapInner()

  在匹配元素里的内容外包一层结构

  ```
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      p {
        background: #bbf;
       }
    </style>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>itbaizhan</p>
    <p>sxt</p>
    <p>web</p>
    <script>$("p").wrapInner("<b></b>");</script>
  </body>
  </html>
  ```

### **DOM操作(四)**

​	**DOM 插入现有元素内**

- **.append()**
- **.prepend()**



- .append()

  在每个匹配元素里面的末尾处插入参数内容

  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>I would like to say: </p>
    <script>
      $("p").append("<strong>Hello</strong>");
    </script>
      //
      <p>I would like to say:<strong>Hello</strong></p>//
  </body>
  </html>
  ```

- .prepend()

  在每个匹配元素里面的头部处插入参数内容

  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <div id="root">
    	<p>分割线</p>
    </div>
    <script>
      $("#root").append("<p>hello world</p>");
    </script>
    /*
    <div id="root">
    	<p>hello world</p>
    	<p>分割线</p>
    </div>
    */
  </body>
  </html>
  ```

### **DOM操作(五)**

​	插入现有元素

- .after

  在匹配元素集合中的每个元素后面插入参数所指定的内容，作为其兄弟节点

  ```
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>I would like to say: </p>
    <script>$("p").after("<b>Hello</b>");</script>
    /*
    <p>I would like to say: </p>
    <b>Hello</b>
  	*/
  </body>
  </html>
  ```

- .before

  根据参数设定，在匹配元素的前面插入内容，作为其兄弟节点

  ```
  <!DOCTYPE html>
  <html>
  <head>
    <script src="./js/jquery-3.6.0.min.js"></script>
  </head>
  <body>
    <p>I would like to say: </p>
    <script>$("p").before("<b>Hello</b>");</script>
    /*
    <b>Hello</b>
    <p>I would like to say: </p>
  	*/
  </body>
  </html>
  ```

### **DOM操作(六)**

DOM 移除

1. .empty()

   从DOM中移除**集合中**匹配元素的所有子节点

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <p>
        Hello, <span>Person</span> <a href="javascript:;">and person</a>
     </p>
     <script>
       $("p").empty();
       //<p>不会删除
     </script>
   </body>
   </html>
   ```

2. .remove()

   将**匹配元素集合**从DOM中删除

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <p>Hello</p>
     <script>
       $("p").remove();
       //整个<p>删除了
     </script>
   </body>
   ```

DOM 替换

1. .replaceAll()

   用集合的匹配元素替换每个目标元素(写法比较反人类)

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <p>Hello</p>
     <script>
       $("<b>World</b>").replaceAll("p");
     </script>
   </body>
   </html>
   ```

2. .replaceWith()

   用提供的内容替换集合中所有匹配的元素

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <p>Wrold</p>
     <script>
       $("p").replaceWith("<div>Hello</div>");
     </script>
   </body>
   </html>
   ```

   

### **CSS操作**

#### (一)尺寸

​	

1. .css()

   获取和设置匹配元素的样式

   ```
   //读取背景颜色
   var color = $(".box").css("background-color");
   
   //设置样式 单个
   $(".box").css("height","200px");
   //多个
   $(".box").css({
   	"width:"200px",
   	heigth:"200px",
   	//如果涉及到-的形式，使用驼峰命名法
       fontSize:"20px",
   });
   ```

   

2. .height()，.width()

   获取元素的当前高度值宽度值或设置元素的高度值宽度值

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <style>
       div {
         width: 100px;
         height: 100px;
         margin: 5px;
         background: rgb(255, 140, 0);
        }
     </style>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <div></div>
     <script>
     	var width = $("div").width();
     	console.log(width);
     	//链式调用
       $("div").height(200).width(200)
     </script>
   </body>
   </html>
   
   ```

   

3. .innerHeight()，.innerWidth()

   为元素的当前计算高度值和宽度值,包括padding，但是不包括border

4. .outerHeight()，.outerWidth()

   获取元素的当前宽度值和高度值,包括padding，border和**选择性**的margin

   ```
   //正常使用.outerHeight()，.outerWidth()不包括margin
   //.outerHeight(true)，.outerWidth(true)就包含margin
   ```

#### (二)位置

1. .offset()

   获取元素的当前坐标，或设置每一个元素的坐标，坐标相对于文档

   ***获取位置***

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <style>
        *{
         margin: 0;
         padding: 0;
        }
       p {
         margin: 10px;
        }
     </style>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <p class="text1">Hello</p>
     <p class="text2"></p>
     <script>
       var offset = $(".text1").offset();
       //返回出一个对象 里面有left和top两个值包含浏览器默认
       //具备的margin和padding
       $(".text2").html("left: " + offset.left + ", top: " + offset.top);
     </script>
   </body>
   </html>
   
   ```

   ***设置位置***

   ```
   <!DOCTYPE html>
   <html>
   <head>
     <style>
       div {
         width: 100px;
         height: 100px;
         background-color: red;
         position: relative;
        }
     </style>
     <script src="./js/jquery-3.6.0.min.js"></script>
   </head>
   <body>
     <div></div>
     <script>
       $("div").offset({ top: 100, left: 100 });
       $("div").offset({ 
       	top: offset.top+100,
       	left: offset.left+100 
       });
     </script>
   </body>
   </html>
   
   ```

2. .position()

   获取元素的当前坐标，相对于`offset parent`的坐标 相当于父级

3. .scrollLeft(), .scrollTop()

   获取元素的当前水平和垂直滚动条的位置。设置每个匹配元素的水平和垂直滚动条位置

   默认都是 不传参获取 传参设置

   



### **事件之绑定事件处理器**

#### **1 .on()**

​	在选定的元素上绑定一个或多个事件处理函数

​	第一个参数为什么事件 第二个为事件处理函数

```
$("#button").on("click", function(event){
  console.log("事件处理器")
});

```

​	事件委托

​	第二个参数为目标元素

```
$("#ul").on("click", "li", function(event){
 console.log($(this).text());
});

```

#### **2 .one()**

为元素的事件添加处理函数。处理函数在每个元素上每种事件类型最多执行一次

```html
$("#btn").one("click", function() {
 console.log("这是一个只能触发一次的事件.");
});
```

#### **3 .off()**

移除一个事件处理函数，移除on事件处理器

```
function aClick() {
      console.log("点击事件")
     }
    $("#btn1").on("click",function () {
      $("#btn3").on("click", aClick);
     });
    $("#btn2").on("click",function () {
      $("#btn3").off("click", aClick);
      });
```

### **事件之鼠标事件**

1. .click()

   为 JavaScript 的"click" 事件绑定一个处理器，或者触发元素上的 "click" 事件 和.on("click", function({})) 同理

   ```
   $("#btn").click(function() {
    alert("点击事件");
   });
   ```

2. .hover()

   将二个事件函数绑定到匹配元素上，分别当鼠标指针进入和离开元素时被执行 前一个是移入函数 后一个是滑出函数 可以写一个移入显示 滑出隐形的事件

   ```html
   $("li").hover(
    // 滑入
    function () {
     console.log("滑入")
     },
    // 滑出
    function () {
     console.log("滑出")
     }
   );
   ```

3. .mouseenter()

   鼠标进入事件

4. .mouseleave()

   鼠标离开事件

5. .mousemove()

   鼠标滑动事件

6. .mouseover()

   鼠标进入事件（注：支持事件冒泡）

7. .mouseout()

   鼠标离开事件（注：支持事件冒泡）



### **事件之表单事件**

#### 	1**.focus()**

​		为 JavaScript 的 "focus" 事件绑定一个获取焦点处理函数，或者触发元素	上的 "focus" 事件

```
$('#input').focus(function() {
 console.log('获得焦点');
});
```

#### 	2.blur()

​		为 "blur" 事件绑定一个失去焦点处理函数

```
$('#other').click(function() {
 $('#target').blur();
});

$('#target').blur(function(){
	console.log("失去焦点");
})

```

#### 	3.change()

​		为JavaScript 的 "change" 事件绑定一个表单改变处理函数

​		内容发生改变、失去焦点、回传都会

```
$('.target').change(function() {
 alert('内容改变');
});

//把改变内容打印出来
$('#element).chanege(function(e){
 console.log(e.target.value); //js方法
 console.log($(e.target).val()); //先转成jQuery对象
 console.log($(this).val());// this代表当前元素 
});
```

#### 	4.submit()

​	当用户提交表单时，就会在这个表单元素上触发submit事件。它只能绑定在	`<form>`元素上

```
$('#target').submit(function() {
 alert('表单提交事件');
});
```



### **事件之键盘事件**

#### 1 .keydown() 

添加键盘按下事件

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="./js/jquery-3.6.0.min.js"></script>
</head>
<body>
  <input type="text" class="username">
  <script>
    $(".username").keydown(function(){
      console.log("键盘");
     })
  </script>
</body>
</html>

```

#### 2 .keypress()

添加键盘事件 不分按下和抬起 都触发

#### 3 .keyup()

添加键盘抬起事件 





### **事件之浏览器事件**

#### 1 .resize()

添加浏览器窗口发生变化触发事件

可视窗口 不包括调试页面

```
$(window).resize(function(){
      console.log("改变浏览器尺寸");
     })
   可以配合$(window).width来使用
```

#### 2 .scroll()

浏览器滚动事件

```
 $(window).scroll(function(){
      console.log("滚动");
     })
可以配合$(window).scrollTop()和$(window).height()来使用
```

### 事件之事件对象

- event.type 

  ​	获取事件类型

  ```
  $("#btn").click("click",function(e){
    console.log(e.type);
  })
  //
  ```

  

- event.target 

  获取当前元素对象

  ```
  $("#btn").click("click",function(e){
    console.log(e.target);
  })
  //会打印出id="btn"的元素
  ```

- event.currentTarget 

  获取当前元素对象

  > **温馨提示**
  >
  > target：指向触发事件元素
  >
  > currentTarget：指向添加事件的元素

  ```
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <script src="./js/jquery-3.6.0.min.js"></script>
    <style>
      div{
        width: 100px;
        height: 100px;
        background-color: red;
       }
    </style>
  </head>
  <body>
    <div id="container">
      <button id="btn">按钮</button>
    </div>
    <script>
      $("#container").click("click",function(e){
        console.log("container",e.currentTarget);
        console.log("container",e.target);
       })
      $("#btn").click("click",function(e){
        console.log("btn",e.currentTarget);
        console.log("btn",e.target);
       })
       
       //target点谁就是打印谁
       //currentTarget因为冒泡会打印出父元素
    </script>
  </body>
  </html>
  ```

- event.preventDefault()

  如果调用这个方法，默认事件行为将不再触发。

  ```
  <a href="https://itbaizhan.com">itbaizhan</a>
  <script>
    $("a").click("click",function(e){
      e.preventDefault();
     })
     //这样a就不跳转了
  </script>
  ```

-  event.stopPropagation()

  防止事件冒泡到DOM树上，也就是不触发的任何前辈元素上的事件处理函数

   

### jQuery_遍历

​	列表遍历

#### 1 .map() 

通过一个函数匹配当前集合中的每个元素,产生一个包含新的jQuery对象

```/
 <ul>
    <li>列表1</li>
    <li>列表2</li>
    <li>列表3</li>
    <li>列表4</li>
  </ul>
  
  <script>
    $("li").map(function(index,element){
      console.log(index,element);
     })
     //index 是从0开始的下标
     //element返回是一个js对象就是一个元素可以使用.innerHTML来修改
  </script>
```

#### 2 .each()

遍历一个jQuery对象，为每个匹配元素执行一个函数

```
$("li").each(function(index,element){
  console.log(index,element);
})

```

**********************************************************
**each和map的返回值不同，map返回一个新的数组，each返回原始数组**

**********************************************************



#### 3 .get()

列表中获得一个JS对象的DOM元素.get() 下标从0开始

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <script src="./js/jquery-3.6.0.min.js"></script>
</head>
<body>
  <ul>
    <li>列表1</li>
    <li>列表2</li>
    <li>列表3</li>
    <li>列表4</li>
  </ul>
  <script>
    var li = $("li").get(0);
    li.innerHTML = "新的列表"
    //get获取的是JS对象
  </script>
</body>
</html>

```

1.JS对象转换成jQuery对象  $( )

```
var lis = document.getElementbyId("li");

console.log($(lis));
```

2.jQuery对象转换成js对象

​	a.获取一个元素使用: get()

​	b.获取每一个元素: each() map()

因为两者的方法不能互相使用所以需要转换





### **jQuery树遍历**

- #### .children()

  获得直接子元素，可以传递一个选择器参数

  ```
  <ul class="first">
      <li>item 1</li>
      <li>
        <ul class="secode">
          <li>child item 1</li>
          <li>child item 2</li>
          <span>child span</span>
        </ul>
      </li>
      <li>item 3</li>
    </ul>
    <script>
      $(".first").children().css("border","1px solid red")
      $(".first").children("li").css("border","1px solid red")
  //只选择后代的li标签 span标签不变
    </script>
  ```

- #### .find()

  寻找后代元素 孙子 重孙都找到了

  `.find()`和`.children()`方法是相似的，但后者只是再DOM树中向下遍历一个层级（注：就是只查找子元素，而不是后代元素）。

- #### .next()

  取得元素紧邻的后面同辈元素 同一个父级

- #### .parent()

  取得元素的父元素

- #### .siblings()

  获得元素的兄弟元素，可以传递一个选择器参数

  全部同级元素 包括**<script>** 里面传参可以锁定什么元素





### **jQuery动画**

#### **(一)**.show()、.hide()、.fadeIn()、.fadeOut()

- .show()

  执行显示动画

  ```
  <style>
      div{
        width: 100px;
        height: 100px;
        background-color: red;
        display: none;
       }
    </style>
    
    、、、
    <body>
    <button>动画</button>
    <div></div>
    <script>
      $("button").click(function(){
        $("div").show(1000)
      })
      //show(time) time:动画执行的时长ms 
      //这里显示就是从无到有
    </script>
  </body>
  ```

  

- .hide()

  执行隐藏动画

  ```
  $("button").click(function(){
    $("div").hide(1000)
  })
  ```

  

- .fadeIn()

  通过淡入的方式**显示**匹配元素

  ​	

  ```
  $("button").click(function () {
   $("div").fadeIn(1000);
  });
  
  ```

- .fadeOut()

  通过淡出的方式**隐藏**匹配元素

  ```
  $("button").click(function () {
   $("div").fadeOut(1000);
  });
  
  ```

#### **(二)**.slideDown() .slideUp() .animate()

- .slideDown()

  用滑动动画显示一个元素

  ```
  $("button").click(function () {
   $("div").slideDown(1000);
  });
  
  //滑动从上到下
  ```

- .slideUp() 

  用滑动动画隐藏一个元素

  ```
  $("button").click(function () {
   $("div").slideUp(1000);
  });
  ```

- .animate()

  执行自定义动画

  ```
  $("button").click(function () {
    $("div").animate({
      width: "200px",
      opacity: 0.5
     }, 1500);
  });
  //第二个参数是动画执行的时长
  ```
