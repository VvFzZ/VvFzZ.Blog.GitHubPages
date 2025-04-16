---
title: 38高性能限流器GuavaRateLimiter
tags:
description:
---

```
//限流器流速：2个请求/秒
RateLimiter limiter = RateLimiter.create(2.0);
//执⾏任务的线程池
ExecutorService es = Executors.newFixedThreadPool(1);
//记录上⼀次执⾏时间
prev = System.nanoTime();
//测试执⾏20次
for (int i = 0; i < 20; i++) {
    //限流器限流
    limiter.acquire();
    //提交任务异步执⾏
    es.execute(() -> {
        long cur = System.nanoTime();
        //打印时间间隔：毫秒
        System.out.println(
                (cur - prev) / 1000_000);
        prev = cur;
    });
}    
```
# 令牌桶算法
1. 令牌以固定的速率添加到令牌桶中,假设限流的速率是r/秒，则令牌每1/r秒会添加一个；
2. 假设令牌桶的容量是b，如果令牌桶已满，则新的令牌会被丢弃；
3. 请求能够通过限流器的前提是令牌桶中有令牌。

令牌桶的容量b:限流器允许的最大突发流量

使用定时器定时生成令牌到桶方案，高并发情况下有问题：
当系统压力已经临近极限的时候，定时器的精度误差会非常大，同时定时器本身会创建调度线程，也会对系统的性能产生影响。

## Guava如何实现令牌桶算法
记录并动态计算下一令牌发放的时间
```

class SimpleLimiter {
    //当前令牌桶中的令牌数量
    long storedPermits = 0;
    //令牌桶的容量
    long maxPermits = 3;
    //下⼀令牌产⽣时间
    long next = System.nanoTime();
    //发放令牌间隔：纳秒
    long interval = 1000_000_000;

    //请求时间在下⼀令牌产⽣时间之后,则
    //	1.重新计算令牌桶中的令牌数
    //	2.将下⼀个令牌发放时间重置为当前时间
    void resync(long now) {
        if (now > next) {
            //新产⽣的令牌数
            long newPermits = (now - next) / interval;
            //新令牌增加到令牌桶
            storedPermits = min(maxPermits, storedPermits + newPermits);
            //将下⼀个令牌发放时间重置为当前时间
            next = now;
        }
    }

    //预占令牌，返回能够获取令牌的时间
    synchronized long reserve(long now) {
        resync(now);
        //能够获取令牌的时间
        long at = next;
        //令牌桶中能提供的令牌
        long fb = min(1, storedPermits);
        //令牌净需求：⾸先减掉令牌桶中的令牌
        long nr = 1 - fb;
        //重新计算下⼀令牌产⽣时间
        next = next + nr * interval;
        //重新计算令牌桶中的令牌
        this.storedPermits -= fb;
        return at;
    }

    //申请令牌
    void acquire() {
        //申请令牌时的时间
        long now = System.nanoTime();
        //预占令牌
        long at = reserve(now);
        long waitTime = max(at - now, 0);
        //按照条件等待
        if (waitTime > 0) {
            try {
                TimeUnit.NANOSECONDS.sleep(waitTime);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

支持预热

# 漏桶算法
漏桶会按照一定的速率自动将水漏掉，只有漏桶里还能注入水的时候，请求才能通过限流器。












