---
title: springboot基础
tags: spring
description: springboot基础
date: 2025-03-29 15:25:28
---

# 参数解析
// http://localhost:8080/getStr/1?ipt=2
```
@RequestMapping("/getStr/{ipt2}")
public String getString(
    @RequestParam(name = "ipt") String ipt
    , @PathVariable(name = "ipt2") String ipt2)
```

