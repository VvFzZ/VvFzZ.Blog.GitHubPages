---
title: 3SpringSecurity扩展
description: 3SpringSecurity扩展
date: 2024-11-07 21:23:53
tags:
---
学习目标
- 理解扩展Spring Security的常见场景和方法
- 掌握自定义用户认证和多因子认证的实现原理和过程

目录
- 实现定制化用户认证
- 使用认证缓存
- 实现多因子认证


# 实现定制化用户认证
1. 扩展UserDetails
2. 扩展UserDetailsService
3. 扩展AuthenticationProvider
4. 整合定制化配置

## 扩展UserDetails
```
public class SpringUser implements UserDetails {
private static final long serialVersionUID = 1L;
private Long id;
private final String username;
private final String password;
private final String phoneNumber;
//省略getter/setter
@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
return Arrays.asList(new SimpleGrantedAuthority("ROLE_USER"));
}
@Override
public boolean isAccountNonExpired() {
return true;
}
@Override
public boolean isAccountNonLocked() {
return true;
}
...
}
```
## 扩展UserDetailsService
获取用户信息
```
//通过Spring Data JPA实现数据访问 
public interface SpringUserRepository extends CrudRepository<SpringUser, Long> {
SpringUser findByUsername(String username);
}

@Service
public class SpringUserDetailsService implements UserDetailsService {
@Autowired
private SpringUserRepository repository;
@Override
public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
SpringUser user = repository.findByUsername(username);
if (user != null) {
return user;
}
throw new UsernameNotFoundException( "SpringUser '" + username + "' not found");
}
}
```
## 扩展AuthenticationProvider
```
@Component
public class SpringAuthenticationProvider implements AuthenticationProvider {
@Autowired
private UserDetailsService userDetailsService;
@Autowired
private PasswordEncoder passwordEncoder;
@Override
public Authentication authenticate(Authentication authentication) {
String username = authentication.getName();
String password = authentication.getCredentials().toString();
UserDetails user = userDetailsService.loadUserByUsername(username);
if (passwordEncoder.matches(password, user.getPassword())) {
return new UsernamePasswordAuthenticationToken(username, password, u.getAuthorities());
} else {
throw new BadCredentialsException("The username or password is wrong!");
}
}
@Override
public boolean supports(Class<?> authenticationType) {
return authenticationType.equals(UsernamePasswordAuthenticationToken.class);
}
}
```
## 整合定制化配置
```
@Configuration
public class SpringSecurityConfig extends WebSecurityConfigurerAdapter {
    @Autowired
    private UserDetailsService springUserDetailsService;
    @Autowired
    private AuthenticationProvider springAuthenticationProvider;
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(springUserDetailsService)
        .authenticationProvider(springAuthenticationProvider);
    }
}
```

# 使用认证缓存
## 认证缓存定义
```
public interface UserCache {
    //从缓存获取用户信息
    UserDetails getUserFromCache(String username);
    //把用户信息放入缓存中
    void putUserInCache(UserDetails user);
    //从缓存中移除用户信息
    void removeUserFromCache(String username);
}
```
UserCache子类：
- EhCacheBasedUserCache
- NullUserCache
- SpringCacheBasedUserCache

### SpringCacheBasedUserCache
```
public class SpringCacheBasedUserCache implements UserCache {
private final Cache cache;
public UserDetails getUserFromCache(String username) {
Cache.ValueWrapper element = username != null ? cache.get(username) : null;
if (element == null) {
return null;
}
else {
return (UserDetails) element.get();
}
}
public void putUserInCache(UserDetails user) {
cache.put(user.getUsername(), user);
}
public void removeUserFromCache(UserDetails user) {
this.removeUserFromCache(user.getUsername());
}
public void removeUserFromCache(String username) {
cache.evict(username);
}
}
```
## 认证缓存应用


# 实现多因子认证


