---
title: 3基于Redis实现分布式锁
description: 3基于Redis实现分布式锁
date: 2024-10-19 15:26:36
tags:
---

- 分布式锁概念和实现
- Redisson分布式锁原理

# 分布式锁概念和实现
Distributed Lock
**应用场景**
重复操作(?)、并发数据正确

**技术需求**
- 互斥
- 防止死锁
设置有效时间，避免无法释放
- 性能
减少锁等待时间导致大量阻塞，粒度尽量小
- 容错
保证外部系统正常（不影响业务），客户端加锁解锁过程可控

**Redis实现分布式锁**
set key value[expiration EX seconds|PX milliseconds][NX|XX]
EX 设置键的过期时间为second秒
PX 设置键的过期时间为millisecond 毫秒
NX 只在键不存在时，才对键进行设置操作。SET key value NX 效果等同于 SETNX key value
XX:只在键已经存在时，才对键进行设置操作
例:SET resource_name my_random_value NX PX 30000
效果:当resource_name这个key不存在时创建这样的key，设值为my_random_value，并设置过期时间30000毫秒

**原子性和Lua脚本**
Redis服务器会单线程原子性执行Lua脚本

分布式删除key
```
//分布式锁删除一个key
if redis.call("get",KEYS[1])== ARGV[1] then
    return redis.call("del',KEYS[1])
else
    return 0
end
```

限制访问频率（指定时间最大访问次数）
```
//实现一个访问颗率限制功能
local times=redis.call('incr',KEYS[1])
// 如果是第一次进来，设置一个过期时间
if times == 1 then
    redis.call('expire',KEYS[1],ARGV[1])
end
//如果在指定时间内访问次数大于指定次数，则返回0，表示访问被限制
if times > tonumber(ARGV[2]) then
    return 0
end 
// 返回1，允许被访问
return 1
```
## Redission分布式锁
实现了可重入锁(ReentrantLock)公平锁(FairLock)、联锁(MultiLock)红锁(RedLock)、读写锁(ReadWriteLock)等,还提供许多分布式服务
Redisson支持单点模式、主从模式、哨兵模式、集群模式，只是配置的不同。
```
public class RedissonLock {
    private Redisson redisson;
    //加锁
    public void lock(string lockName, long leaseTime){
        RLock rLock = redisson.getLock(lockName);
        rLock.lock(leaseTime,TimeUnit.SECONDS);
    }
    //释放锁
    public void unlock(string lockName){
        redisson.getLock(lockName).unlock();
    }
    //判断是否加锁
    public boolean isLock(string lockName){
        RLock rLock = redisson.getLock(lockName);
        return rLock.isLocked();
    }
    //获取锁
    public boolean tryLock(String lockName, long leaseTime){
        RLock rLock =redisson.getLock(lockName);
        boolean getLock = false;
        try {
            getLock = rLock.tryLock(leaseTime, TimeUnit.SECONDS);
            } catch (InterruptedException e){
                e.printstackTrace();
            }
            return false;
        return getLock;
    }
}
```

## RedisTemplate分布式锁
**高版本**
```
//加锁
public boolean setIfNotExists(String key, String value, int seconds){
    key = getkey(key);
    return redisTemplate.opsForValue().setIfAbsent(key, value,seconds,TimeUnit.SEcONDs);
}
//释放
public Boolean unlock(string key, string value){
    key = getKey(key);
    return redisTemplate.execute(UNLOCK SCRIPT, Collections,singletonList(key), value);
}
```
**低版本**
需自己通过脚本实现
```
//加锁
public Boolean lock(String key, String value, int expireseconds){
    key = getkey(key);
    return redisTemplate.execute(LocK SCRIPT, Collections,singletonList(key), value, expireseconds);
}
//lua脚本，用来设置分布式锁
private static final string LOCK LUA SCRIPT =
    "if redis.call('setNx',KEYS[1],ARGV[1])then\n" +
    "   if redis.call('get',KEYS[1])==ARGV[1] then\n" +
    "       return redis.call('expire',KEYS[1],ARGV[2])\n" +
    "   else\n"+
    "       return 0\n" +
    "   end\n" +
    "end\n";
private static final RedisScript<Boolean> LOCK SCRIPT = RedisScript.of(LOCK LUA SCRIPT, Boolean.class);

//释放锁
//lua脚本，用来释放分布式锁
private static final String UNLOCK LUA SCRIPT =
    "if redis.call('get',KEYS[1])== ARGV[1] then\n" +
    "   return redis.call('del',KEYS[1])\n"
    "else\n" +
    "   return 0\n"+
    "end";
private static final RedisScript<Boolean> UNLOCK SCRIPT = RedisScript.Of(UNLOCK LUA SCRIPT,Boolean.class);

```

# Redisson分布式锁原理
典型的分布式锁实现

**执行流程** 
获取锁->成功，启动看门狗 、 执行lua脚本

**看门狗WatchDog**
业务未处理完成时，自动延长锁时间(默认30s)

**RLock接口**
```
public interface RRLock {
    //加锁，锁的有效期默认30秒
    void lock();
    
    //获取锁，如果获取成功，则返回true，如果获取失败(即锁已被其他线程获取)，则返回false
    boolean tryLock();
    boolean tryLock(long time, TimeUnit unit)throws InterruptedException;
    
    //解锁
    void unlock();
    
    //中断锁，表示该锁可以被中断
    void lockInterruptibly();
    void lockInterruptibly(long leaseTime, TimeUnit unit);
    
    //检验该锁是否被线程使用，如果被使用返回True
    boolean isLocked();
```
`tryLock`
`tryAquire`
`tryLockInnerAsync`
`unlockInnerAsync`
非本线程持有锁返回nil，重入次数减一，若为0则释放锁，若大于0则延长过期时间
![](RLock接口实现类.png)

## 异常情况
- 客户端长时间内阻塞导致锁失效
网络问题或者GC等原因导致长时间阻塞，然后业务程序还没执行完锁就过期
- Redis服务器时钟漂移
如果Redis服务器的机器时间发生了向前跳跃，就会导致这个key过早超时失效
- 单点实例安全问题
Redis主机在同步锁之前宕机那么向其他及其申请锁就会再次得到这把锁

**RedLock**
```
//获取多个 RLock 对象
RLock lock1=redissonclient1.getLock(lockkey);
RLock lock2 = redissonclient2.getLock(lockKey);
RLock lock3 =redissonclient3.getLock(lockKey);
//根据多个RLock对象构建
RedissonRedLockRedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
try {
    //尝试获取锁
    boolean res = redLock.tryLock(100，10,TimeUnit.SECONDS);
    if(res){
        //成功获得锁，在这里处理业务
    } catch(Exception e){
        throw new RuntimeException("aquire lock fail");
    }finally{
        //无论如何，最后都要解锁
        redLock.unlock();
    }
```

# 示例
getLock tryLock releaseLock



# 思考题
列举日常开发中分布式锁应用场景？
Zookeeper实现
redis实现

# 分布式锁常见问题