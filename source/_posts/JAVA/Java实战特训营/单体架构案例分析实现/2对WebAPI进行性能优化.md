---
title: 2对WebAPI进行性能优化
date: 2024-09-05 10:27:50
tags: 
description: 对WebAPI进行性能优化
---

# 对Web API进行性能优化
![](1.3.png)
## Spring AOP和代理机制
### AOP的概念和作用
![](AOP的概念和作用.png)

#### PointCut

```
@Pointcut("execution(public * com.vvf.springboot1.demos.web.*.hello(..))")
public void pointCut() {}
```
execution表达式说明：
- public：访问修饰符 (可省略) 
- *：返回值（public，protected）
- com.vvf.springboot1.demos.web： 包名
- .*：com.vvf.springboot1.demos.web后的.*表示包下所有类（不包含子包 .. 包含子包）
- .hello：方法名
    - .hello* 匹配前缀hello的方法
    - .*hello 匹配后缀hello的方法
- (..): 参数，..代表任何参数
#### Advice
- Before
- AfterReturn
- After
- AfterThrowing
- Around
执行顺序
```
around before
before
hello
afterReturn
after
around after
```
#### JoinPoint
- 获取切入点目标对象
    如：获取目标对象的类名 `joinPoint.getTarget().getClass().getName()`
- 获取切入方法签名
    如：`joinPoint.getSignature().getDeclaringType()` 
- 获取参数列表
    `joinPoint.getArgs()`



### 动态代理实现AOP
- JDK动态代理
- CGLIB动态代理
#### JDK动态代理

```
    @Test
    public void testJDKProxy() {
        Human p = new Person("vvf");
        PersonHandler h = new PersonHandler(p);
        Human o = (Human) Proxy.newProxyInstance(
                p.getClass().getClassLoader(),
                p.getClass().getInterfaces(),
                h);
        o.showName();
    }

interface Human {
    void showName();
}

class Person implements Human {
    String name;

    public Person(String name) {
        this.name = name;
    }

    public Person() {
    }


    public void showName() {
        System.out.println(this.name);
    }
}

class PersonHandler implements InvocationHandler {

    Object target;

    public PersonHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("before");
        Object r = method.invoke(target, args);
        System.out.println("after");
        return r;
    }
}
```

#### CGLIB动态代理

```
   @Test
    public void testCGLIProxy() {
        Person person = PersonProxyFactory.createProxy();
        person.showName();
    }
class PersonProxyFactory {
    public static Person createProxy() {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(Person.class);
        enhancer.setCallback(new PersonProxy());
        Object r = enhancer.create();
        return (Person) r;
    }

    public static Person createProxy(Class[] cls, Object[] args) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(Person.class);
        enhancer.setCallback(new PersonProxy());
        Object r = enhancer.create(cls, args);
        return (Person) r;
    }
}

class PersonProxy implements MethodInterceptor {

    @Override
    public Object intercept(Object o, Method method, Object[] objects, MethodProxy methodProxy) throws Throwable {
        System.out.println("before");
        Object r = methodProxy.invokeSuper(o, objects);
        System.out.println("after");
        return r;
    }
}

class Person {
    String name;

    public Person(String name) {
        this.name = name;
    }

    public Person() {
    }


    public void showName() {
        System.out.println(this.name);
    }
}
```

#### 区别是什么？
<imgr src="JDK动态代理vsCGLIB动态代理.png">

##### 性能哪个更好，怎么选？
使用Spring AOP的ScopeProxyMode枚举测试
策略：通过两种方式生成对象并重复值执行同一个方法比较执行时间
<img src="1.2-SpringBoot动态代理-CGLIB.png">
<img src="1.2-SpringBoot动态代理-JDK.png">


JDKProxy性能高些

## Spring Web异步处理机制


带来的好处和问题有哪些？
问题：代码复杂度，线程切换
### WebMVC架构
![](1.3-WebMVC架构.png)

### WebMVC的性能问题
Servlet是同步阻塞式的
任何请求响应过程是同步的，要等待服务器工作线程接收请求、阻塞等待I/O以及完成请求处理后才能返回
![](1.3-阻塞式IO.png)
### 异步处理的场景
- 异步请求处理
- 即发即弃
- 大数据量请求处理
![alt text](1.3-异步场景1.png) 
![alt text](1.3-异步场景3.png) 
![alt text](1.3-异步场景2.png)>

### 请求同步转异步

#### 整体架构
基于代理机制实现同步操作异步化
- 继承JDK动态代理机制
- 继承JDK执行器服务
即：代理对象+线程池
![alt text](1.3-请求同步转异步整体架构.png)>

代理类代码：（未分离线程池版本）
```
class DynamicProxy implements AsyncProxy, InvocationHandler {

    Object target;

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Future<?> future = Executors.newCachedThreadPool().submit(() -> {
            try {
                method.invoke(target, args);
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new RuntimeException(e);
            }
        });
        return future;
    }

    @Override
    public Object proxy() {
        Object o = Proxy.newProxyInstance(
                target.getClass().getClassLoader(),
                target.getClass().getInterfaces(),
                this);

        return o;
    }
}
```

### Spring Web异步处理
![alt text](1.3-SpringMVC异步处理.png)
返回WebAsyncTask<>

```


    @GetMapping("/async/{staffId}")
    public WebAsyncTask<CustomerStaffRespVO> asyncFindCustomerStaffById(@PathVariable("staffId") Long staffId) {

        System.out.println("The main Thread name is" + Thread.currentThread().getName());

        ThreadPoolTaskExecutor taskExecutor = new ThreadPoolTaskExecutor();
        taskExecutor.setCorePoolSize(30);
        taskExecutor.setMaxPoolSize(30);
        taskExecutor.setQueueCapacity(50);
        taskExecutor.setThreadNamePrefix("Web");
        //启动一个异步Web任务
        WebAsyncTask<CustomerStaffRespVO> task = new WebAsyncTask<CustomerStaffRespVO>(5 * 1000L, taskExecutor, () -> {
            System.out.println("The working Thread name is" + Thread.currentThread().getName());

            Thread.sleep(10 * 1000L);

            CustomerStaff customerStaff = customerStaffService.findCustomerStaffById(staffId);

            CustomerStaffRespVO customerStaffRespVO = CustomerStaffConverter.INSTANCE.convertResp(customerStaff);
            return customerStaffRespVO;
        });

        //任务超时设置：添加类似熔断的效果
        task.onTimeout(() -> {
            System.out.println(Thread.currentThread().getName());
            System.out.println("Timeout");

            return new CustomerStaffRespVO();
        });

        //任务完成时的执行效果
        task.onCompletion(() -> {
            System.out.println("Finished");
        });

        //任务执行异常时
        task.onError(() -> {
            System.out.println("Error");
            return new CustomerStaffRespVO();
        });

        //可以继续执行其他操作
        System.out.println("Task继续执行中");

        return task;
    }


```

#### 优化
可选参数 taskExecutor,默认使用SimpleAsyncTaskExecutor处理异步方法执行。
可设置合理的线程池参数优化性能

## Web容器优化技巧
### 使用Undertow替换Tomcat
基于非阻塞式IO模型
![](1.3-Web容器优化技巧-Undertow.png)
![](1.3-Web容器优化技巧-Undertow2.png)

### 定制Tomcat ConnectorCustomizer
设置Tomcat Nio2协议  
![](1.3-Web容器优化技巧-Tomcat参数.png)

### 优化tomcat参数
![](1.3-Web容器优化技巧-Tomcat参数2.png)
![](1.3-Web容器优化技巧-Tomcat参数3.png)

根据实际情况配置参数
1. 平稳流量
2. 偶发突发流量情况
3. 耗时请求情况
4. 请求丢弃情况

## 问题
- JDK动态代理和CGLIB动态代理的区别？
JDK动态代理基于接口实现
CGLIB动态代理基于类

- CompletableFulture和传统Future相比有哪些优势？
CompletableFulture提供后续处理接口
