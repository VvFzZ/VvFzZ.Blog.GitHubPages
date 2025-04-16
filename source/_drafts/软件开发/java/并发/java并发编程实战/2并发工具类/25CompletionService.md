---
title: 25CompletionService
tags:
description:
---
批量执行异步任务

CompletionService将线程池和阻塞队列组合使用，让批量管理异步任务更简单，先执行完先进入阻塞队列。
## 构造方法
```
ExecutorCompletionService(Executor executor)；
ExecutorCompletionService(Executor executor, BlockingQueue<Future<V>> completionQueue)。
```
自己创建线程池可提供线程池隔离特性，避免耗时任务拖垮系统。

## 接口
```
Future<V> submit(Callable<V> task);
Future<V> submit(Runnable task, V result);
Future<V> take() throws InterruptedException;//空队列阻塞
Future<V> poll();//空队列返回null
Future<V> poll(long timeout, TimeUnit unit) throws InterruptedException;//等待unit时间仍空队列返回null
```
## 实现Dubbo中的Forking Cluster
Dubbo中有一种叫做Forking的集群模式，并行调用服务，一个返回结果，整个服务就返回
如地址转坐标服务，为保证服务高可用和性能，可以并行调用3个地图服务商API，只要有1个正确返回，那么地址转坐标这个服务就直接返回。这种集群模式可以容忍2个地图服务商服务异常，缺点是消耗的资源偏多。
```
public class _25CompletionService {
    @Test
    void do1() throws InterruptedException, ExecutionException {
        ExecutorService pool = Executors.newFixedThreadPool(9);
        ExecutorCompletionService service = new ExecutorCompletionService(pool, new ArrayBlockingQueue<>(10));
        List<Future> list = new ArrayList<>();
        Future<String> f1 = service.submit(() -> {
            return getPrice1Sleep10();
        });
        list.add(f1);
        Future<String> f2 = service.submit(() -> {
            return getPrice2Sleep2();
        });
        list.add(f2);
        Future<String> f3 = service.submit(() -> {
            return getPrice3Sleep5();
        });
        list.add(f3);

        BlockingQueue<String> bq =
                new LinkedBlockingQueue<>(10);

        try {
            for (int i = 0; i < 3; i++) {
                System.out.printf("take %s\r\n", i);
                Future take = service.take();
                String r = take.get().toString();
                System.out.printf("take %s ok,r:%s\r\n", i, r);
                if (r != null) {
                    break;
                }
            }
        }finally {
            for (Future f : list) {
                f.cancel(true);
            }
        }
    }

    private String getPrice1Sleep10() {
        System.out.println("1-start will sleep 10s");
        try {
            TimeUnit.SECONDS.sleep(10);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        System.out.println("1 sleep end");
        return "1-result";
    }

    private String getPrice2Sleep2() {
        System.out.println("2-start will sleep 2s");
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        System.out.println("2 sleep end");
        return "2-result";
    }

    private String getPrice3Sleep5() {
        System.out.println("3-start will sleep 5s");
        try {
            TimeUnit.SECONDS.sleep(5);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        System.out.println("3 sleep end");
        return "3-result";
    }
}
```



