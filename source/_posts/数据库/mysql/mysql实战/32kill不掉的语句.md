---
title: 32kill不掉的语句
description: 32kill不掉的语句
date: 2025-03-21 21:40:04
tags: mysql
---
kill不掉的情况，其实是因为发送 kill 命令的客户端，并没有强行停止目标线程的执行，而只是设置了个状态，并唤醒对应的线程。而被 kill 的线程，需要执行到判断状态的“埋点”，才会开始进入终止逻辑阶段。并且，终止逻辑本身也是需要耗费时间的。所以，如果你发现一个线程处于killed状态，你可以做的事情就是，通过影响系统环境，让这个killed状态尽快结束。
比如，如果是InnoDB并发度的问题，可以临时调大innodb_thread_concurrency的值，或者停掉别的线程，让出位子给这个线程执行。
如果是回滚逻辑由于受到 IO 资源限制执行得比较慢，就通过减少系统压力让它加速
