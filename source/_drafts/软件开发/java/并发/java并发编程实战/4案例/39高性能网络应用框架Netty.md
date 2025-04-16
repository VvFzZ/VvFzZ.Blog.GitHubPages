---
title: 39高性能网络应用框架Netty
tags:
description:
---
# Reactor模式

核心逻辑
while(true){} 的方式调用事件多路选择器提供的select()方法监听网络事件，有就绪网络事件就绪遍历事件处理器处理。
# Netty线程模型
## EventLoop
核心概念EventLoop事件循环 对应Reactor模式的reactor，负责网络事件监听和调用事件处理器处理。 
多线程对应一个EventLoop，EventLoop和Java线程11对应，即一个网络连接只对应一个线程，避免并发问题

## EventLoopGroup
处理TCP连接请求和读写请求是两个不同的socket
bossGroup处理连接请求，workerGroup处理读写请求；bossGroup处理完连接请求后，会将连接提交给workerGroup，轮训选择其中一个EventLoop处理




