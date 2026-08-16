---
title: "Vue3指令"
description: "记录一下几个Vue的指令"
pubDate: "2025-03-27T20:48"
tags: ["开源", "Vue"]
---

> 整理一下几个`v-`开头的Vue指令 v-bind、v-fi、v-show、v-for、v-on、v-model

先列个表简述一个每个是干什么用的

| 指令      | 描述                                                         |
| :-------- | :----------------------------------------------------------- |
| `v-bind`  | 用于将 Vue 实例的数据绑定到 HTML 元素的属性上。              |
| `v-if`    | 用于根据表达式的值来条件性地渲染元素或组件。                 |
| `v-show`  | v-show 是 Vue.js 提供的一种指令，用于根据表达式的值来条件性地显示或隐藏元素。 |
| `v-for`   | 用于根据数组或对象的属性值来循环渲染元素或组件。             |
| `v-on`    | 用于在 HTML 元素上绑定事件监听器，使其能够触发 Vue 实例中的方法或函数。 |
| `v-model` | 用于在表单控件和 Vue 实例的数据之间创建双向数据绑定。        |

## 1. v-bind：属性绑定

动态绑定 HTML 属性，可简写为 `:`：

```vue
<template>
  <!-- 原始写法（无动态绑定） -->
  <img src="固定地址.jpg" alt="图片">

  <!-- v-bind 完整写法 -->
  <img v-bind:src="imgUrl" v-bind:alt="imgAlt">

  <!-- v-bind 简写（推荐） -->
  <img :src="imgUrl" :alt="imgAlt">

  <!-- 绑定对象（批量设置属性） -->
  <div v-bind="attrObj"></div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 单个值用 ref
const imgUrl = ref('动态地址.jpg')
const imgAlt = ref('动态描述')

// 对象用 reactive
const attrObj = reactive({
  id: 'box',
  class: 'container'
})
</script>
```

## 2. v-if：条件渲染

根据条件**动态创建 / 销毁**元素：

```vue
<template>
  <!-- 简单条件 -->
  <div v-if="isShow">我会被创建或销毁</div>

  <!-- v-if + v-else -->
  <div v-if="isLogin">欢迎回来</div>
  <div v-else>请先登录</div>

  <!-- v-if + v-else-if + v-else -->
  <div v-if="score >= 90">优秀</div>
  <div v-else-if="score >= 60">及格</div>
  <div v-else>不及格</div>
</template>

<script setup>
import { ref } from 'vue'

const isShow = ref(true)
const isLogin = ref(false)
const score = ref(85)
</script>
```

## 3. v-show：条件显示

根据条件**切换显示 / 隐藏**（仅修改 `display` 样式，元素始终存在）：

```vue
<template>
  <!-- v-show 用法 -->
  <div v-show="isVisible">我会被显示或隐藏</div>
</template>

<script setup>
import { ref } from 'vue'

const isVisible = ref(false) // 元素会被设置为 display: none
</script>
```

> 区别：`v-if` 适用于切换频率低的场景（性能开销大），`v-show` 适用于切换频率高的场景（初始渲染开销大）。

## 4. v-for：列表渲染

循环渲染数组或对象，需配合 `:key` 使用（提升性能）：

```vue
<template>
  <!-- 遍历数组 -->
  <ul>
    <li v-for="(item, index) in list" :key="item.id">
      {{ index + 1 }}. {{ item.name }}
    </li>
  </ul>

  <!-- 遍历对象 -->
  <div v-for="(value, key) in user" :key="key">
    {{ key }}: {{ value }}
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// 数组用 ref
const list = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' }
])

// 对象用 reactive
const user = reactive({
  name: 'coke',
  age: 21
})
</script>
```

## 5. v-on：事件绑定

绑定 DOM 事件，可简写为 `@`：

```vue
<template>
  <!-- 完整写法 -->
  <button v-on:click="handleClick">点击我</button>

  <!-- 简写（推荐） -->
  <button @click="handleClick">点击我</button>

  <!-- 传递参数 -->
  <button @click="sayHi('小明')">打招呼</button>

  <!-- 事件修饰符（如阻止默认行为） -->
  <form @submit.prevent="handleSubmit">
    <button type="submit">提交</button>
  </form>
</template>

<script setup>
// 直接定义函数，无需 methods 包裹
const handleClick = () => {
  console.log('按钮被点击了')
}

const sayHi = (name) => {
  console.log(`你好，${name}`)
}

const handleSubmit = () => {
  console.log('表单已提交（无刷新）')
}
</script>
```

## 6. v-model：双向数据绑定

表单控件与数据双向绑定（数据变→视图变，视图变→数据变）：

```vue
<template>
  <!-- 输入框 -->
  <input type="text" v-model="username" placeholder="请输入用户名">
  <p>你输入的是：{{ username }}</p>

  <!-- 复选框 -->
  <input type="checkbox" v-model="isAgree"> 同意协议

  <!-- 下拉框 -->
  <select v-model="selectedCity">
    <option value="beijing">北京</option>
    <option value="shanghai">上海</option>
  </select>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const isAgree = ref(false)
const selectedCity = ref('beijing')
</script>
```

> `v-model` 本质是语法糖，等价于 `:value` + `@input` 事件的结合。
