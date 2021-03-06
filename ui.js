gh = gh || {};
gh.host = gh.host || "";
gh.cdnPublicRoot = gh.cdnPublicRoot || "";
gh.cdnImgRoot = gh.cdnImgRoot || "";
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
    if (gh.debug) {
        return path;
    }
    return gh.cdnPublicRoot + path;
}
gh.isPC = function() {
    var system = {
        win: false,
        mac: false,
        xll: false,
        ipad: false
    };

    var platform = navigator.platform;

    system.win = platform.indexOf("Win") == 0;
    system.mac = platform.indexOf("Mac") == 0;
    system.x11 = (platform == "X11") || (platform.indexOf("Linux") == 0);
    system.ipad = (navigator.userAgent.match(/iPad/i) != null) ? true : false;

    if (system.win || system.mac || system.xll || system.ipad) {
        return true;
    }
    return false;
}
gh.ua = {
    isAndroid: function() {
        return navigator.userAgent.match(/Android/i) ? true : false;
    },
    isBlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i) ? true : false;
    },
    isIOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
    },
    isWindowsMobile: function() {
        return navigator.userAgent.match(/IEMobile/i) ? true : false;
    },
    isMobile: function() {
        return (gh.ua.isAndroid() || gh.ua.isBlackBerry() || gh.ua.isIOS() || gh.ua.isWindowsMobile());
    },
    isWeixin: function() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == "micromessenger") {
            return true;
        } else {
            return false;
        }
    }
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
        if (typeof gh.editor != 'undefined') {
            var text = gh.editorText();
            var content = gh.editorHTML();
            if (text.length < 3) {
                gh.alert("内容字数过少，请完善内容");
                return error++;
            }
            data[key] = content;
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
            var timeout = response.data.timeout || timeout || 1.5;
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
        var timeout = $btn.attr('timeout') || 1.5;
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
    var editorJs = gh.cdn("/wangEditor.min.js");
    gh.load(editorJs, function() {
        initEditor(options);
    });

    function initEditor(options) {
        var E = window.wangEditor;
        gh.editor = new E(options.element);
        gh.editor.config.height = 400;
        gh.editor.config.menus = [
            'head',
            'bold',
            //'fontSize',
            //'fontName',
            'italic',
            //'underline',
            'strikeThrough',
            //'indent',
            //'lineHeight',
            'foreColor',
            //'backColor',
            //'link',
            'list',
            //'justify',
            'quote',
            'emoticon',
            'image',
            //'video',
            'table',
            //'code',
            //'splitLine',
            'undo',
            'redo',
        ]
        if (gh.ua.isMobile()) {
            gh.editor.config.menus = [];
        }
        gh.editor.config.showFullScreen = false;
        gh.editor.config.fontNames = ['黑体', '仿宋', '楷体', '宋体', '微软雅黑'];
        gh.editor.config.colors = ['#ab2b2b', '#069', '#337d56', '#9d5b8b', '#dcb183', '#f0f0f0', '#000'];
        gh.editor.config.fontSizes = {
            'x-small': { name: '10px', value: '1' },
            'small': { name: '13px', value: '2' },
            'normal': { name: '16px', value: '3' },
            'large': { name: '18px', value: '4' },
            'x-large': { name: '24px', value: '5' },
            'xx-large': { name: '28px', value: '6' }
        }
        var i = 0;
        var ldw = [];
        while (i++ < 16) {
            ldw[i] = { alt: '[' + i + ']', src: gh.cdn('/lib/ldw/' + i + '.gif') }
        }
        var baidu = [];
        while (i++ < 45) {
            baidu[i] = { alt: '[' + i + ']', src: gh.cdn('/lib/baidu/' + i + '.png') }
        }
        gh.editor.config.emotions = [{
            title: '百度',
            type: 'image',
            content: baidu
        }, {
            title: '绿豆蛙',
            type: 'image',
            content: ldw
        }]
        gh.editor.config.uploadImgServer = gh.cdnParams.bucket;
        gh.editor.config.uploadImgParams = {
            policy: gh.cdnParams.policy,
            signature: gh.cdnParams.signature
        }
        gh.editor.config.uploadFileName = 'file';
        gh.editor.config.customAlert = function(msg) {
            gh.alert(msg);
        }
        gh.editor.config.uploadImgHooks = {
            success: function(xhr) {
                console.log('success', xhr)
            },
            fail: function(xhr, editor, resData) {
                console.log('fail', resData)
            },
            error: function(xhr, editor, resData) {
                console.log('error', xhr, resData)
            },
            timeout: function(xhr) {
                console.log('timeout')
            },
            customInsert: function(insertImgFn, result) {
                var url = gh.cdnImgRoot + result.url;
                insertImgFn(url)
            }
        }
        gh.editor.create();

        gh.editorText = function() {
            return gh.editor.txt.text();
        }
        gh.editorHTML = function() {
            return gh.editor.txt.html();
        }

    }
});
gh.fn('editormd', function(options) {
    var editorJs = gh.cdn("/editormd/editormd.min.js");
    gh.load(editorJs, function() {
        initEditor(options);
    });

    function initEditor(options) {
        var $markdown = $(options.element);
        var html = $markdown.html();
        $markdown.empty();

        gh.editor = editormd("editor", {
            imageUpload: true,
            imageFormats: ["jpg", "jpeg", "gif", "png", "bmp", "webp"],
            imageUploadURL: gh.cdnParams.bucket,
            //previewTheme: "dark",
            //editorTheme: "pastel-on-dark",
            markdown: html || "hi.",
            codeFold: true,
            //syncScrolling : false,
            saveHTMLToTextarea: true,
            searchReplace: true,
            watch: true,
            //htmlDecode: "style,script,iframe|on*",    
            toolbar: true,
            previewCodeHighlight: true,
            emoji: true,
            taskList: true,
            tocm: true,
            tex: true,
            flowChart: true,
            sequenceDiagram: true,
            // width: "100%",
            // height: "100%",
            path: gh.cdn("/editormd/lib/")
        });

        gh.editorText = function() {
            return gh.editor.getMarkdown();
        }
        gh.editorHTML = function() {
            return gh.editor.getMarkdown();
        }
    }
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
            data.append("signature", gh.cdnParams.signature);
            data.append("policy", gh.cdnParams.policy);
            data.append("file", $fileInput.get(0).files[0]);
            $.ajax({
                url: gh.cdnParams.bucket,
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
    if($('.zone.breadcrumb').length <=0){
        $('.body.pagen').addClass('breadcrumbOff');
    }
    $('a[href=]').removeAttr('href');
    $('.body.pagen').css({ "min-height": $(window).height() - 160 });
    // $('.super').each(function() {
    //     $(this).appendTo('body');
    // });
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
            width: $(window).width() > 900 ? 800 : null,
            close_text: "关闭"
        });
    });
    $('img').error(function() {
        $(this).attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAGElEQVQImWP8////fwYkwITMIUKAgYEBAAZdBAQD2YmbAAAAAElFTkSuQmCC');
        //$(this).hide();
    });

    if (location.pathname == '/') {
        $('.zone.breadcrumb *').css({ "cursor": "auto" });
    }

    // 返回顶部
    var $anchor = $('.anchor');
    var $body = $('.body.pagen');
    $(window).scroll(function(event) {
        if ($(window).scrollTop() > 100) {
            var offset = $(window).width() - $body.width();
            $anchor.css({ right: offset / 2 + 20 });
            $anchor.show();
        } else {
            $anchor.hide();
        }
    });
    $('.anchor.topper').on('click', function(event) {
        $("html,body").animate({ scrollTop: 0 }, 500);
    });
    $('.anchor.toc').on('click', function(event) {
        $('#toc').toggle();
    });
    $('#toc').on('click', function(event) {
        $('#toc').hide();
    });

    // mardown 渲染
    if (gh.markdown) {
        editormd.markdownToHTML("markdown", {
            tocm: true,
            tocContainer: "#toc",
            htmlDecode: "style,script,iframe",
            emoji: true,
            taskList: true,
            tex: true,
            flowChart: true,
            sequenceDiagram: true,
        });

    }
    $('.zone.footer .statement').html("");
    var $breadcrumb = $('.zone.breadcrumb');
    if ($breadcrumb.length > 0) {
        $breadcrumb.after(gh.segments.region);
    } else {
        $('div.body.pagen').prepend(gh.segments.region);
    }
    if (gh.regionPath) {
        if (gh.regionPath.collapse) {
            $('.zone.region').addClass('optional menu hide');
        }
        var $regionZone = $('.zone.region .tab.region');
        if (gh.regionPath.region) {
            var $regionKey = $regionZone.find('ul.thin li.key:contains(' + gh.regionPath.region + ')').addClass('focus');
            $regionZone.children('.content').children('.item:eq(' + $regionKey.index() + ')').addClass('on');
        }
        if (gh.regionPath.province) {
            var $provinceKey = $regionZone.find('li.key:contains(' + gh.regionPath.province + ')').addClass('focus');
            $provinceKey.closest('.tab.province').children('.content').children('.cities:eq(' + $provinceKey.index() + ')').addClass('on');
        }
        if (gh.regionPath.city) {
            $regionZone.find('a:contains(' + gh.regionPath.city + ')').addClass('focus');
        }

    }

    // 段落自折叠
    $('.collapse.partial').each(function() {
        var $wrapper = $(this);
        var $desciption = $(this).find('.a');
        var $content = $(this).find('.b');
        $desciption.show();
        $content.hide();

        if ($desciption.text() == $content.text()) {
            return;
        }

        $desciption.append("<span class='flagger a'> ...全文</span>");
        $content.last().after("<div class='flagger b'> ===== 折叠 ===== </div>");

        var $flaggerA = $desciption.find('.flagger.a');
        var $flaggerB = $wrapper.find('.flagger.b');
        $flaggerB.hide();

        $flaggerA.on('click', function() {
            $desciption.hide();
            $content.show();
            $flaggerB.show();
        });
        $flaggerB.on('click', function() {
            $desciption.show();
            $content.hide();
            $flaggerB.hide();
        });
    });

    // 菜单自滚动
    if (gh.ua.isMobile()) {
        var $lv2 = $('.lv2');
        $lv2.addClass('scroll-x');
        $lv2.find('.pagen').width(6000);
    }

    if (gh.ua.isWeixin()) {
        $('body').addClass('ua-weixin');
    }

    var $tree = $('.zone.tree .ease');
    if ($tree.attr('bg')) {
        $tree.addClass('bg');
        $tree.css({ 'background-image': 'url(' + $tree.attr('bg') + ')' });
    }

    if (gh.debug) {
        //$('.footer .statement').append('ua:' + navigator.userAgent);
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
    $('input.ui').not('[type=hidden]').addClass('input');
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
        $('.input.ui').each(function() {
            var $input = $(this);
            var parentWidth = $input.parent().width() || $input.closest('.pagen').width() - 80;
            var $label = $input.siblings('label,.label');
            var offset = $label.width() || 80;
            var toWidth = parentWidth - offset - 50;
            $input.width(toWidth);
        });

        if ($(window).width() < 501) {
            $('body').addClass('mob');
        } else {
            $('body').removeClass('mob');
        }
    };
    auto();
    $(window).resize(function() {
        gh.log('window.resized')
        auto();
    });
    // 表单提交流
    $('.btn[api],.icon[api],.api[api]').each(function() {
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

gh.run('AMap', function() {
    if ($('.switch.amap').length < 1) {
        return;
    }

    $('body.gh').append('<div id="popupAMap" class="modal inline hide super"><div id="AMap"></div></div>')
    $('#AMap').css({
        "height": Math.max(Math.min($(window).height() - 100, 500), 200)
    });

    var cityName = gh.cityName;
    var cityCenter = null;
    var runAMapWidget = function() {
        map = new AMap.Map('AMap', {
            viewMode: '3D',
            zoom: 12
        });
        map.setCity(cityName);
        map.plugin(["AMap.ToolBar", "AMap.Scale", "AMap.DistrictSearch", 'AMap.Weather'], function() {
            map.addControl(new AMap.Scale());
            map.addControl(new AMap.ToolBar());

            var district = new AMap.DistrictSearch({
                extensions: 'all',
                level: 'district'
            });
            district.search(cityName, function(status, result) {
                var bounds = result.districtList[0].boundaries;
                cityCenter = result.districtList[0].center;
                console.log(result.districtList[0]);
                console.log(cityCenter.pos);
                var polygons = [];
                if (bounds) {
                    for (var i = 0, l = bounds.length; i < l; i++) {
                        var polygon = new AMap.Polygon({
                            map: map,
                            strokeWeight: 1,
                            path: bounds[i],
                            fillOpacity: 0.1,
                            fillColor: '#015f5a',
                            strokeColor: '#BF0A2B'
                        });
                        polygons.push(polygon);
                    }
                    map.setFitView();
                }

                var weather = new AMap.Weather();
                weather.getLive(cityName, function(err, data) {
                    if (!err) {
                        var str = [];
                        str.push('<h4 >实时天气' + '</h4><hr>');
                        str.push('<div>城市/区：' + data.city + '</div>');
                        str.push('<div>天气：' + data.weather + '</div>');
                        str.push('<div>温度：' + data.temperature + '℃</div>');
                        str.push('<div>风向：' + data.windDirection + '</div>');
                        str.push('<div>风力：' + data.windPower + ' 级</div>');
                        str.push('<div>空气湿度：' + data.humidity + '</div>');
                        str.push('<div>发布时间：' + data.reportTime + '</div>');
                        var marker = new AMap.Marker({ map: map, position: [cityCenter.lng, cityCenter.lat] });
                        var infoWin = new AMap.InfoWindow({
                            content: '<div class="info amap">' + str.join('') + '</div>',
                            isCustom: true,
                            offset: new AMap.Pixel(0, -37)
                        });
                        infoWin.open(map, marker.getPosition());
                        marker.on('mouseover', function() {
                            infoWin.open(map, marker.getPosition());
                        });
                    }
                });

            });


        });
    };

    var state = 0;
    $('.switch.amap').on('click', function(e) {

        if (state > 0) {
            return false;
        }
        state = 1;
        $.getScript("//webapi.amap.com/maps?v=2.0&key=7a691853c163226237988b482ce8ee6b")
            .done(function() {
                runAMapWidget();
            })
            .fail(function() {
                state = 0;
            });
    });
});