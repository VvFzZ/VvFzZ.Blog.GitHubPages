---
title: 2SpringSecurity核心原理
description: 2SpringSecurity核心原理
date: 2024-11-07 21:23:46
tags:
---

引入pom文件，做基本配置就能做到认证授权的原理

学习目标
- pring security用户认证的抽象过程和实现方法
- pring security授权的设计思想和实现原理
- pring security过滤器的运行机制

目录
- 用户和认证
- 过滤器机制
- 授权流程

#  用户和认证

## Spring Security中的用户对象
- UserDetails 描述Spring Security中的用户
- GrantedAuthority 定义用户所能执行的操作权限
- UserDetailsService 定义对UserDetails的查询操作
- UserDetailsManager 扩展UserDetailsService，添加新增和修改用户功能 

UserDetailsService、UserDetailsManager接口读写分离设计，*读写分离设计有什么意义呢？*

![](2-SpringSecurity中用户相关类结构图.png)


## Spring Security中的认证对象
`Authentication`
`AuthenticationProvider`
`AuthenticationManager`

```
public interface Authentication extends Principal, Serializable { 
    
}
```

**AuthenticationManager应用示例**
```
public class UsernamePasswordAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response)
throws AuthenticationException {
…
String username = obtainUsername(request);
String password = obtainPassword(request);
…
UsernamePasswordAuthenticationToken authRequest = new
UsernamePasswordAuthenticationToken(username, password);
setDetails(request, authRequest);
return this.getAuthenticationManager().authenticate(authRequest);
}
…
}
```
![](2-SpringSecurity中认证相关类结构图.png)




# Spring Security过滤器机制

![](集成Filter的认证相关类结构.png)

## 自定义过滤器
```
public class LoggingFilter implements Filter {
    private final Logger logger = Logger.getLogger
    (AuthenticationLoggingFilter.class.getName());

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String uniqueRequestId = httpRequest.getHeader("UniqueRequestId");
        logger.info("成功对请求进行了认证：" + uniqueRequestId);
        filterChain.doFilter(request, response);
    }
}
```

```
public class RequestValidationFilter implements Filter {
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain filterChain)throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        String requestId = httpRequest.getHeader("SecurityFlag");
        if (requestId == null || requestId.isBlank()) {
            httpResponse.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }
        filterChain.doFilter(request, response);
    }
}
```
## 过滤器的顺序
```
@Override
protected void configure(HttpSecurity http) throws Exception {
    http.addFilterBefore( new RequestValidationFilter(),BasicAuthenticationFilter.class)
    .addFilterAfter(new LoggingFilter(),BasicAuthenticationFilter.class)
    .authorizeRequests()
    .anyRequest()
    .permitAll();
}
```

## Spring Security授权流程


**拦截请求**
```
public abstract class AbstractSecurityInterceptor {
protected InterceptorStatusToken beforeInvocation(Object object) {
…
//获取代表权限的ConfigAttribute对象，配置的权限信息 
Collection<ConfigAttribute> attributes = this.obtainSecurityMetadataSource()
.getAttributes(object);
…
//获取认证信息
Authentication authenticated = authenticateIfRequired();
try {
    //执行授权
this.accessDecisionManager.decide(authenticated, object, attributes);
}
catch (AccessDeniedException accessDeniedException) {
…
}
…
}
}
```













