---
title: 31GuardedSuspension模式
tags:
description:
---
等待唤醒机制的规范实现
GuardedObject 
obj持有的受保护对象（回复消息）
调用者get() 获取受保护对象（回复消息），检查条件等待
消费者fireEvent()

```
class GuardedObject<T>{
  //持有受保护的对象
  T obj;
  final Lock lock = new ReentrantLock();
  final Condition done =lock.newCondition();
  final int timeout=2;
  //保存所有GuardedObject
  final static Map<Object, GuardedObject> gos=new ConcurrentHashMap<>();
  //静态方法创建GuardedObject
  static <K> GuardedObject create(K key){
    GuardedObject go=new GuardedObject();
    gos.put(key, go);
    return go;
  }

  
  static <K, T> void fireEvent(K key, T obj){
    GuardedObject go=gos.remove(key);
    if (go != null){
      go.onChanged(obj);
    }
  }
  //事件通知方法
  void onChanged(T obj) {
    lock.lock();
    try {
      this.obj = obj;
      done.signalAll();
    } finally {
      lock.unlock();
    }
  }

  //获取受保护对象  
  T get(Predicate<T> p) {
    lock.lock();
    try {
      //MESA管程推荐写法
      while(!p.test(obj)){
        done.await(timeout, TimeUnit.SECONDS);
      }
    }catch(InterruptedException e){
      throw new RuntimeException(e);
    }finally{
      lock.unlock();
    }
    //返回非空的受保护对象
    return obj;
  }
}


//处理浏览器发来的请求
Respond handleWebReq(){
  int id=序号生成器.get();
  //创建一消息
  Message msg1 = new 
    Message(id,"{...}");
  //创建GuardedObject实例
  GuardedObject<Message> go=
    GuardedObject.create(id);  
  //发送消息
  send(msg1);
  //等待MQ消息
  Message r = go.get(
    t->t != null);  
}
void onMessage(Message msg){
  //唤醒等待的线程
  GuardedObject.fireEvent(
    msg.id, msg);
}
```