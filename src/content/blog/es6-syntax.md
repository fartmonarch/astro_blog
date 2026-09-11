---
title: "ES6语法糖"
description: "记录一下这两天学习的ES6"
pubDate: "2025-03-05T19:10"
tags: ["学习笔记", "ES6"]
---

## 1.let、const

区分一下let、const、var

|       特性       |             `var`              |               `let`                | `const`                            |
| :--------------: | :----------------------------: | :--------------------------------: | ---------------------------------- |
|    **作用域**    |     函数作用域或全局作用域     |       块级作用域（`{}` 内）        | 块级作用域                         |
|   **变量提升**   | 存在提升，初始值为 `undefined` | 存在提升，但未初始化（暂时性死区） | 存在提升，但未初始化（暂时性死区） |
|   **重复声明**   |   允许在同一作用域内重复声明   |           不允许重复声明           | 不允许重复声明                     |
|  **初始化要求**  | 可选，不初始化值为 `undefined` |   可选，不初始化值为 `undefined`   | **必须**在声明时初始化             |
|   **重新赋值**   |              允许              |                允许                | **不允许**（常量）                 |
| **全局声明挂载** |  会挂载为 `window` 对象的属性  |        不会挂载到 `window`         | 不会挂载到 `window`                |

现在大家的共识：优先使用`const`，仅在需要修改变量时使用`let`，彻底抛弃`var`。

## 2.解构赋值

### 1.数组解构

```js
// ES5 写法
let a = ["张三","李四","王五"];
let a1 = a[0], a2 = a[1], a3 = a[2];
 
// ES6 解构赋值
let [a1,a2,a3] = a;
console.log(a1,a2,a3); // 张三 李四 王五
```

### 2.对象解构

 ```js
 let user = {
 	name:"coke",
 	age: 21,
 	likes:["唱","跳",“rap”]
 };
 // 快速提取属性
 let {name,age,likes} = user;
 // 嵌套解构
 let [l1,l2,l3] = likes;
 console.log(name, age, h1); // coke 21 唱
 ```

解构赋值在处理函数参数、接口返回数据时尤为实用，大幅减少冗余代码

## 3.模版字符串

模版字符串也叫拼接字符串

```js
//ES5时的拼接字符串
var name = '小明';
var age = 18;
var info = '我叫' + name + '，今年' + age + '岁。';

// ES6模板字符串
const name = '小明';
const age = 18;
const info = `我叫${name}，今年${age}岁。`;
```

## 4.箭头函数

```
// ES5写数组map
var numbers = [1, 2, 3];
var doubled = numbers.map(function(num) {
  return num * 2;
});

// ES6箭头函数
const numbers = [1, 2, 3];
const doubled = numbers.map(num => num * 2);
```

## 5.扩展运算符

合并数组或对象时的原始方案：

```js
// ES5合并数组
var arr1 = [1, 2];
var arr2 = [3, 4];
var combined = arr1.concat(arr2); // [1,2,3,4]

// ES5合并对象
var obj1 = { a: 1 };
var obj2 = { b: 2 };
var merged = Object.assign({}, obj1, obj2); // {a:1, b:2}
```

ES6 扩展运算符让操作更简单：

```js
// ES6合并数组
const arr1 = [1, 2];
const arr2 = [3, 4];
const combined = [...arr1, ...arr2]; // [1,2,3,4]

// ES6合并对象
const obj1 = { a: 1 };
const obj2 = { b: 2 };
const merged = { ...obj1, ...obj2 }; // {a:1, b:2}
```

**超实用场景**：复制数组或对象（避免引用传递）：

```js
const arr = [1, 2, 3];
const copy = [...arr]; 

const obj = { a: 1 };
const clone = { ...obj }; 
```

## 6. Class（类）

ES5 用构造函数 + 原型链模拟类：

```js
// ES5 构造函数
function Person(name, age) {
  this.name = name;
  this.age = age;
}
// 原型方法
Person.prototype.sayHi = function() {
  console.log(`我是${this.name}`);
};
// 继承
function Student(name, age, grade) {
  Person.call(this, name, age); // 继承属性
  this.grade = grade;
}
Student.prototype = Object.create(Person.prototype); // 继承方法
Student.prototype.constructor = Student;

const stu = new Student('小明', 18, '高三');
stu.sayHi(); // 我是小明
```

ES6 Class 语法糖更清晰：

```js
// ES6 Class
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  sayHi() {
    console.log(`我是${this.name}`);
  }
}
// 继承
class Student extends Person {
  constructor(name, age, grade) {
    super(name, age); // 调用父类构造函数
    this.grade = grade;
  }
}

const stu = new Student('小明', 18, '高三');
stu.sayHi(); // 我是小明
```

Class 让面向对象编程更符合传统语言习惯，代码可读性大幅提升。

## 7. Promise（异步编程）

ES5 处理多层异步易形成 “回调地狱”：

```js
// ES5 回调地狱示例
function fetchData(callback) {
  setTimeout(() => {
    callback('数据1');
  }, 1000);
}
fetchData((data1) => {
  console.log(data1);
  setTimeout(() => {
    console.log('数据2');
    setTimeout(() => {
      console.log('数据3');
    }, 1000);
  }, 1000);
});
```

ES6 Promise 用链式调用解决回调地狱：

```js
// ES6 Promise
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('数据1'); // 成功调用resolve
      // reject('出错了'); // 失败调用reject
    }, 1000);
  });
}

fetchData()
  .then((data1) => {
    console.log(data1);
    return '数据2'; // 下一个then接收
  })
  .then((data2) => {
    console.log(data2);
    return '数据3';
  })
  .then((data3) => {
    console.log(data3);
  })
  .catch((err) => {
    console.error(err); // 捕获错误
  });
```

Promise 是异步编程的核心，后续 async/await 也基于它实现。

## 8. Symbol & Bigint（新原始类型）

### 1. Symbol（唯一值）

ES5 中对象属性名都是字符串，易冲突；ES6 Symbol 生成唯一标识符：

```js
// ES5 可能的属性冲突
const obj = { name: 'coke' };
obj.name = 'cola'; // 覆盖原属性

// ES6 Symbol
const s1 = Symbol('描述');
const s2 = Symbol('描述');
console.log(s1 === s2); // false（即使描述相同，值也唯一）

const obj = {
  [s1]: '私有属性' // 用Symbol做属性名，避免冲突
};
console.log(obj[s1]); // 私有属性
```

Symbol 常用于定义对象的 “私有” 属性或避免命名冲突。

### 2. Bigint（大整数）

ES5 中 Number 只能安全表示 ±2^53-1 范围内的整数，超出会精度丢失；ES6 Bigint 解决此问题：

```js
// ES5 大整数精度丢失
console.log(9007199254740992 + 1); // 9007199254740992（精度丢失）

// ES6 Bigint（数字后加n）
const bigNum1 = 9007199254740991n;
const bigNum2 = bigNum1 + 1n;
console.log(bigNum2); // 9007199254740992n（精确）
```

Bigint 用于处理金融、科学计算等需要超大整数的场景。

## 9. Set & Map（新数据结构）

### 1. Set（无重复值的集合）

ES5 用数组去重需手动判断；ES6 Set 自动去重：

```js
// ES5 数组去重
const arr = [1, 2, 2, 3, 3, 3];
const uniqueArr = [];
arr.forEach(item => {
  if (!uniqueArr.includes(item)) uniqueArr.push(item);
});
console.log(uniqueArr); // [1,2,3]

// ES6 Set
const set = new Set([1, 2, 2, 3, 3, 3]);
const uniqueArr = [...set]; // 转数组
console.log(uniqueArr); // [1,2,3]

// Set 常用方法
set.add(4); // 添加
set.delete(1); // 删除
console.log(set.has(2)); // true（是否存在）
console.log(set.size); // 3（元素个数）
```

Set 适合处理去重、交集 / 并集 / 差集等集合操作。

### 2. Map（键值对集合）

ES5 用对象做映射时，键只能是字符串 / Symbol；ES6 Map 键可以是任意类型：

```js
// ES5 对象映射的限制
const obj = {};
const key = { id: 1 };
obj[key] = 'value'; // 对象键会被转为字符串 "[object Object]"
console.log(obj['[object Object]']); // value（所有对象键都冲突）

// ES6 Map
const map = new Map();
const key1 = { id: 1 };
const key2 = function() {};
map.set(key1, '对象键的值');
map.set(key2, '函数键的值');

console.log(map.get(key1)); // 对象键的值
console.log(map.has(key2)); // true
map.delete(key1);
console.log(map.size); // 1

// 遍历 Map
map.forEach((value, key) => {
  console.log(key, value);
});
```

Map 适合需要非字符串键、频繁增删键值对的场景，性能优于对象。
