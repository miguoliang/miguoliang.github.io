---
title: "Sweetalert Text New Line"
date: 2022-03-26T12:47:21+08:00
draft: false
---

It's different between the two API `swal(title, text)` and `swal(option)` on showing multi line text.

```javascript
    const lines = ['line_1', 'line_2', 'line_3'];
    swal(lines.join('<br>')); // it works
    swal({ text: lines.join('<br>') }); // it does not work
```

**Note:** for [Sweetalert2](https://sweetalert2.github.io/) Version 8.x and higher, the API has changed to `Swal.fire(...)`.

* version 7.x demo in [version 7.x](https://jsfiddle.net/jyrtqxc8/2/)
* version 9.x demo in [version 9.x](https://jsfiddle.net/j63qzut2/)
