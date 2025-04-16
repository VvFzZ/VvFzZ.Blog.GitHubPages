---
title: 33ThreadPerMessage模式
tags:
description:
---
线程实现成本高，频繁创建销毁成本高，无限创建OOM
轻量级线程:协程

OpenJDK Loom项目，解决Java语言的轻量级线程问题，轻量级线程被叫做Fiber