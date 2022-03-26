+++ 
draft = false
date = 2022-03-26T14:20:44+08:00
title = "Spring Security CORS Settings"
description = ""
slug = ""
authors = []
tags = []
categories = []
externalLink = ""
series = []
+++

## 1. Activate CORS filter

Create a class named WebSecurityConfig which is inherited from WebSecurityConfigurerAdapter, and override its configure method, like this:

```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(final HttpSecurity httpSecurity) throws Exception {
        httpSecurity.cors();
    }
}
```

## 2. Configure CORS settings

Create a class named WebCorsConfig, add the *Configuration* annotation to it, and add a method named corsConfigurationSource with the Bean annotation, like this:

```java
import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class WebCorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedHeaders(Arrays.asList(CorsConfiguration.ALL));
        configuration.setAllowedMethods(Arrays.asList(CorsConfiguration.ALL));
        configuration.setAllowedOrigins(Arrays.asList(CorsConfiguration.ALL));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(5000L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}
```

**NOTE**: Spring framework looking for beans it requires by the function's name, therefore developers need to make sure that their compelling are correct.
