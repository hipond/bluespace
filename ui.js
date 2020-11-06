// v1.0.1
gh = {};
gh.host = "";
gh.cdnPublicRoot = "";
gh.cdnImgRoot = "";
gh.uniqid = 0;
gh.kvMap = {};
gh.regex = {};
gh.regex.username = /^[\w\u4e00-\u9fa5]{3,24}$/;
gh.regex.email = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
gh.regex.password = /^\w{8,32}$/;
gh.regex.title = /^.{1,256}$/;
gh.fieldRuleMap = {
    username: function(value) {
        if (!gh.regex.username.test(value)) {
            return '用户名不能有特殊字符';
        }
        if (/(^\_)|(\__)|(\_+$)/.test(value)) {
            return '用户名首尾不能出现下划线\'_\'';
        }
        if (/^\d+\d+\d$/.test(value)) {
            return '用户名不能全为数字';
        }
    },
    password: function(value) {
        if (!gh.regex.password.test(value)) {
            return '密码必须8到24位数字或字母';
        }
    },
    email: function(value) {
        if (!gh.regex.email.test(value)) {
            return '邮箱格式有误';
        }
    },
    logined: function() {
        if (!gh.logined) {
            gh.alert("请登录");
            setTimeout(function() {
                location = gh.path('/passport/login?from=topic.comment');
            }, 800);
            return false;
        }
    }
};
gh.path = function(path) {
    if (/^http[s]*:\/\//i.test(path)) {
        return path;
    }
    return gh.host + path;
}
gh.cdn = function(path) {
    return gh.cdnPublicRoot + path;
}
gh.alert = function(message, timeout, fn, type) {
    Messenger.options = {
        extraClasses: 'messenger-fixed messenger-on-top',
        theme: 'future'
    }
    var type = (type == 1 || type == 'success') ? 'success' : 'error';
    Messenger().post({
        message: message,
        type: type,
        showCloseButton: false,
        id: "gh-alert",
        hideAfter: timeout || 1.3,
        onClickClose: true
    });
    if (timeout > 0) {
        setTimeout(function() {
            if (typeof fn === 'string') {
                window.location = fn;
                return;
            }
            fn();
        }, timeout);
    }
}
gh.confirm = function(message, fn) {
    Messenger.options = {
        extraClasses: 'messenger-fixed messenger-on-top',
        theme: 'future',
        id: "gh-confirm"
    }
    var msg = Messenger().post({
        message: message,
        type: 'error',
        actions: {
            confirm: {
                label: '确定',
                action: function() {
                    msg.cancel();
                    return fn();
                }
            },
            cancel: {
                label: '取消',
                action: function() {
                    return msg.cancel();
                }
            }
        }
    });
}

gh.run = function(key, fn) {

    gh.runHub = gh.runHub || {};
    gh.runId = gh.runId || 0;

    if (typeof key === 'undefined') {
        var i = 0;
        while (i++ <= gh.runId) {
            if (typeof gh.runHub[i] === 'object') {
                gh.runHub[i].fn();
            }
        }
        return;
    }

    id = ++gh.runId;
    if (typeof arguments[1] === 'undefined') {
        fn = key;
        key = id;
    }
    gh.runHub[id] = {
        "key": key,
        "fn": fn
    };
}

// 函数工具库
gh.fn = function(key, v) {
    gh.fnHub = gh.fnHub || {};
    if (typeof v === 'function') {
        return gh.fnHub[key] = v;
    } else {
        return gh.fnHub[key](v);
    }
}

gh.log = function() {
    gh.debug = gh.debug || false;
    if (gh.debug) {
        console.log(arguments);
    }
};
gh.data = function(element) {
    var $form = typeof element === 'string' ? $(element) : element;
    var data = {};
    var error = 0;
    $form.find('input').not('[type=file]').each(function() {
        if (error) {
            return;
        }
        var $input = $(this);
        var key = $input.attr('name');
        var title = $input.attr('title') || $input.siblings('label').text() || $input.attr('name');
        var value = $input.val();
        var required = $input.attr('required');
        var patterns = $input.attr('exp');
        var equal = $input.attr('equal');
        if (required) {
            if (value.length < 1) {
                gh.alert('请填写`' + title + '`');
                return error++;
            }
        }
        if (patterns) {
            patterns = patterns.split("|");
            var matched = false;
            var errmsg = false;
            $.each(patterns, function(i, pattern) {
                if (fn = gh.fieldRuleMap[pattern]) {
                    errmsg = fn(value);
                    if (!errmsg) {
                        matched = true;
                    }
                } else {
                    var regex = gh.regex[pattern];
                    if (!regex) {
                        gh.alert("规则配置异常：" + title + ":" + pattern);
                    }
                    if (regex.test(value)) {
                        matched = true;
                    }
                }
            });
            if (!matched) {
                gh.alert(errmsg || '`' + title + '`格式有误');
                return error++;
            }
        }
        if (equal) {
            var $equal = $form.find('input[name=' + equal + ']');
            var equalValue = $equal.val() || null;
            if (equalValue != value) {
                gh.alert('`' + title + '`不匹配');
                return error++;
            }
        }
        data[key] = value;
    });
    if (error) {
        return;
    }
    $form.find('.radio.checked').each(function() {
        var $radio = $(this);
        var key = $radio.attr('name');
        data[key] = $radio.val() || $radio.attr('value');
    });
    // 图片相关资源
    $form.find('.src').each(function() {
        var $src = $(this);
        var key = $src.attr('name');
        data[key] = $src.val() || $src.attr('src');
    });
    $form.find('.textarea').each(function() {
        if (error) {
            return;
        }
        var $area = $(this);
        var key = $area.attr('name');
        if ($area.hasClass('editor')) {
            var editorId = $area.attr('editor') || null;
            if (!editorId) {
                gh.alert("error.editor.id");
                return error++;
            }
            var editor = gh.kvMap[editorId] || null;
            if (!editor) {
                gh.alert("error.editor.object");
                return error++;
            }
            if (editor.getLength() < 3) {
                gh.alert("内容字数过少，请完善内容");
                return error++;
            }
            data[key] = editor.root.innerHTML;
        } else {
            data[key] = $area.val();
        }
    });
    if (error) {
        return;
    }
    return data;
};

gh.post = function(url, data, timeout, redirect) {
    $.post(gh.path(url), data, function(response) {
        if (response.state === 1) {
            var timeout = response.data.timeout || timeout || 1500;
            gh.alert(response.message, timeout, function() {
                var redirect = redirect || response.data.location;
                if (redirect && redirect != '#') {
                    if (redirect == '.') {
                        redirect = location;
                    }
                    window.location = redirect;
                }
            }, 'success');
        } else {
            gh.alert(response.message);
        }
    }, "json");
}
gh.runPostFlow = function($btn) {
    if ($btn.hasClass('off')) {
        return false;
    }
    $btn.addClass('off');
    setTimeout(function() {
        $btn.removeClass('off');
    }, 3000);

    function postFlow() {
        var api = $btn.attr('api');
        if (!api) {
            gh.alert('error.btn.api');
        }
        var data = $btn.hasClass('empty') ? {} : gh.data($btn.closest('.form'));
        var timeout = $btn.attr('timeout') || 1500;
        var redirect = $btn.attr('redirect') || null;
        if (!data) {
            return false;
        }
        gh.post(api, data, timeout, redirect);
        return false;
    }

    var confirm = $btn.attr('confirm');
    if (confirm) {
        return gh.confirm(confirm, function() {
            postFlow();
        });
    }
    return postFlow();
}

gh.load = function(url, fn, options) {
    gh.loadMap = gh.loadMap || {};
    if (gh.loadMap[url] === 1) {
        return fn();
    }
    options = $.extend(options || {}, {
        dataType: "script",
        cache: true,
        url: url
    });
    return jQuery.ajax(options).done(function() {
        gh.loadMap[url] = 1;
        return fn();
    });
}
gh.fn('editor', function(options) {
    var $textarea = $(options.element);
    $textarea.after("<input class='upload image hide' type='file' name='file'/>");
    var $fileInput = $textarea.next('input.upload.image');
    var colors = ['#ab2b2b', '#069', '#337d56', '#9d5b8b', '#dcb183', '#f0f0f0', '#000'];
    var editor = new Quill(options.element, {
        placeholder: '正文内容...',
        modules: {
            toolbar: [
                { header: 1 }, { header: 2 },
                { color: colors },
                'bold', 'italic', 'underline',
                { 'align': [] },
                'image',
                { list: 'ordered' },
                { list: 'bullet' },
                { 'script': 'sub' }, { 'script': 'super' },
                'code-block',
                'clean'
            ],
            uploader: false,
        },
        theme: 'snow'
    });
    editor.getModule("toolbar").addHandler("image", function(e) {
        if (e) {
            $fileInput.click();
        } else {
            editor.format('image', false);
        }
    });

    editor.root.addEventListener('paste', function(e) {
        e.preventDefault();
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
            $.each(e.clipboardData.files, function(i, file) {
                if (!file.type.match(/^image\/(gif|jpe?g|a?png|bmp)/i)) {
                    cosole.log(file);
                    return;
                }
                uploadImage(file);
            });
        }

    }, false);

    editor.root.addEventListener('drop', function(e) {

        e.preventDefault();

        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
            if (document.caretRangeFromPoint) {
                var selection = document.getSelection();
                var range = document.caretRangeFromPoint(e.clientX, e.clientY);
                if (selection && range) {
                    selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
                }
            }
            $.each(e.dataTransfer.files, function(i, file) {
                if (!file.type.match(/^image\/(gif|jpe?g|a?png|bmp)/i)) {
                    return;
                }
                uploadImage(file);
            });
        }
        e.dataTransfer.clearData();
        return false;
    }, false);

    // 过滤粘贴数据格式
    // editor.clipboard.addMatcher(Node.ELEMENT_NODE, function(node, delta) {
    //     var ops = [];
    //     $.each(delta.ops, function(k, op) {
    //         if (op.insert && typeof op.insert === 'string') {
    //             ops.push({
    //                 insert: op.insert
    //             })
    //         }
    //     });
    //     delta.ops = ops
    //     return delta
    // })

    $fileInput.on('change', function() {
        uploadImage();
    });

    function uploadImage(file) {
        if (!file) {
            if ($fileInput.val() == '') {
                gh.log('fileInput:empty');
                return;
            }
            file = $fileInput.get(0).files[0];
        }
        var data = new FormData();
        data.append("signature", options.signature);
        data.append("policy", options.policy);
        data.append("file", file);
        gh.log(data);
        $.ajax({
            url: options.url,
            data: data,
            type: "POST",
            async: false,
            cache: false,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function(response) {
                var imageUrl = gh.cdnImgRoot + response.url + "!content";
                var pointer = editor.getSelection();
                var imgRange = 0 + (pointer === null ? 0 : pointer.index);
                editor.insertEmbed(imgRange, 'image', imageUrl);
                editor.setSelection(1 + imgRange);
            },
            error: function(data) {
                gh.log(data);
            }
        });
    }
    var editorId = ++gh.uniqid;
    $textarea.attr("editor", editorId);
    gh.kvMap[editorId] = editor;
    return editor;
});
gh.fn('imageUploader', function(options) {
    var $element = $(options.element);
    $element.after("<input class='upload image hide' type='file' name='file'/>");
    var $fileInput = $element.next('input.upload.image');

    $element.on('click', function() {
        $fileInput.click();
    });
    $fileInput.on('change', function() {
        upload();
    });

    function upload() {
        if ($fileInput.val() == '') {
            gh.log('fileInput:empty');
        } else {
            var data = new FormData();
            data.append("signature", options.signature);
            data.append("policy", options.policy);
            data.append("file", $fileInput.get(0).files[0]);
            gh.log(data);
            $.ajax({
                url: options.url,
                data: data,
                type: "POST",
                async: false,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "json",
                success: function(response) {
                    var url = gh.cdnImgRoot + response.url + "!content";
                    $element.attr('src', url);
                },
                error: function(data) {
                    gh.log(data);
                }
            });
        }
    }
});

// 基础组件渲染
gh.run('com.common', function() {
    $('.zone.breadcrumb a').not(':first').before('|');
    $('a[href=]').removeAttr('href');
    $('.body.main').css({ "min-height": $(window).height() - 130 });
    $('.super').each(function() {
        $(this).appendTo('body');
    });
    $('.popup[inline]').each(function() {
        var $element = $(this);
        if ($element.hasClass('logined') && !gh.logined) {
            return;
        }
        $element.modaal({
            type: "inline",
            overlay_close: false,
            content_source: $element.attr('inline'),
            fullscreen: $element.attr('fullscreen') ? true : false,
            width: $(window).width() > 700 ? 700 : null,
            close_text: "关闭"
        });
    });
    $('img').error(function() {
        $(this).hide();
    });

    if (location.pathname == '/') {
        $('.zone.breadcrumb *').css({ "cursor": "auto" });
    }
});

// 标签渲染
gh.run('com.tab', function() {
    $('.tab').each(function() {
        var $tab = $(this);
        var $head = $tab.children('.head').first();
        var $content = $tab.children('.content').first();
        var $keys = $head.children('.key');
        var $items = $content.children('.item');
        $keys.each(function() {
            var $key = $(this);
            var idx = $key.index();
            $key.on('click', function() {
                $keys.removeClass("focus");
                $key.addClass("focus");
                $items.removeClass('on');
                $items.eq(idx).addClass('on');
            });
        });
        // init
        $keys.eq(0).addClass("focus");
        $items.eq(0).addClass('on');
    });

    $(".switch[rel]").on('click', function(e) {
        // diy
        $('.zone.optional.region.menu .tab.province .content').css({ 'min-height': 'auto' });

        e.preventDefault();
        var cardName = $(this).attr('rel');
        var cards = $('.zone.optional');
        var card = $('.zone.optional.' + cardName);
        cards.not(card).hide();
        card.slideToggle();
        return false;
    });
    $(document).bind("click", function(e) {
        if ($(e.target).closest(".zone.optional").length == 0 &&
            $(e.target).closest(".switch[rel]").length == 0) {
            $('.zone.optional').slideUp();
        }
    });
});
// 表单渲染
gh.run('com.form', function() {
    // ui
    $('input[type=hidden]').addClass('hidden');
    $('input').not('[type=hidden]').addClass('input');
    // 单选框
    $('.radio').each(function() {
        var $radio = $(this);
        var $radios = $radio.siblings('.radio');
        $radio.parent().children('.radio').first().addClass('first');
        $radio.on('click', function() {
            $radios.removeClass('checked');
            $radio.addClass('checked');
        });
    });

    // 图片
    $('.topic .content img,.comment .content img').each(function() {
        var $img = $(this);
        $img.closest('p').addClass('img');
        var src = $img.attr('src');
        var link = "<a href='" + src + "' data-lightbox='one'></a>";
        $img.wrap(link);
    });

    // 自适应
    var auto = function() {
        $('.input').each(function() {
            var $input = $(this);
            var $parent = $input.closest('.body.main');
            var $label = $parent.children('label,.label').first();
            var offset = $label.width() || 150;
            var toWidth = $parent.width() - offset - 50;
            $input.width(toWidth);
        });
    };
    auto();
    $(window).resize(function() {
        gh.log('window.resized')
        auto();
    });
    // 表单提交流
    $('.btn[api],.icon[api]').each(function() {
        var $btn = $(this);
        $btn.on('click', function() {
            return gh.runPostFlow($btn);
        });
    });
});


gh.run('com.debug', function() {
    if (!gh.debug) {
        return;
    }
    var ws = null;
    var url = "ws://127.0.0.1:9502";
    window.onload = function() {
        console.log("onload");
        ws = new WebSocket(url);
        ws.onopen = function() {
            console.log("connected to " + url);
        }
        ws.onclose = function(e) {
            console.log("connection closed (" + e.code + ")");
        }
        ws.onmessage = function(e) {
            console.log("message received: " + e.data);
            if (e.data == "reload") {
                location = location;
            }
        }
    };
});