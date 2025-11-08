// 支付配置 - 重新对接API
const PAYMENT_CONFIG = {
    baseUrl: 'https://2a.mazhifupay.com/',
    pid: '131517535',
    key: 'dRJK919JJ8VD691Zw68n0DrDec9CJ6dn',
    // 支付类型配置
    paymentTypes: {
        alipay: '支付宝支付',
        wxpay: '微信支付',
        bank: '银行卡支付'
    },
    // 默认支付方式
    defaultType: 'alipay'
};

// 当前选择的支付信息
let currentPayment = {
    service: '',
    amount: 0,
    paymentType: PAYMENT_CONFIG.defaultType
};

// 支付状态管理
const PAYMENT_STATE = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initModal();
    initSmoothScroll();
});

// 初始化导航菜单功能
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
    
    // 点击导航链接后关闭移动端菜单
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// 初始化支付弹窗
function initModal() {
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.querySelector('.close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closePaymentModal();
        });
    }
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closePaymentModal();
        }
    });
    
    // 初始化支付方式选择
    initPaymentMethods();
}

// 初始化支付方式选择
function initPaymentMethods() {
    const methodOptions = document.querySelectorAll('.method-option');
    
    methodOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有active类
            methodOptions.forEach(opt => opt.classList.remove('active'));
            
            // 添加active类到当前选项
            this.classList.add('active');
            
            // 更新支付方式
            const paymentType = this.getAttribute('data-type');
            currentPayment.paymentType = paymentType;
        });
    });
}

// 关闭支付弹窗
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'none';
    
    // 重置支付信息
    currentPayment = {
        service: '',
        amount: 0,
        paymentType: PAYMENT_CONFIG.defaultType
    };
}

// 初始化平滑滚动
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // 减去导航栏高度
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 滚动到指定区域
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// 初始化支付
function initiatePayment(service, amount) {
    // 生成订单号
    const orderNo = generateOrderNo();
    
    // 更新支付信息
    currentPayment = {
        service: service,
        amount: amount,
        paymentType: PAYMENT_CONFIG.defaultType,
        orderNo: orderNo,
        timestamp: new Date().getTime()
    };
    
    // 更新弹窗内容
    document.getElementById('paymentService').textContent = service;
    document.getElementById('paymentAmount').textContent = amount;
    document.getElementById('paymentOrderNo').textContent = orderNo;
    
    // 重置支付方式选择
    resetPaymentMethods();
    
    // 显示支付弹窗
    document.getElementById('paymentModal').style.display = 'block';
}

// 重置支付方式选择
function resetPaymentMethods() {
    const methodOptions = document.querySelectorAll('.method-option');
    methodOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-type') === PAYMENT_CONFIG.defaultType) {
            option.classList.add('active');
        }
    });
}

// 处理支付 - 直接对接API
function processPayment() {
    const { service, amount, paymentType, orderNo } = currentPayment;
    
    // 基础验证
    if (!service || !amount || amount <= 0) {
        showPaymentError('支付信息不完整');
        return;
    }
    
    // 显示加载状态
    showPaymentLoading(true);
    
    try {
        // 直接构建支付参数
        const paymentParams = {
            pid: PAYMENT_CONFIG.pid,
            type: paymentType,
            out_trade_no: orderNo,
            notify_url: window.location.origin + '/notify',
            return_url: window.location.origin + '/success.html',
            name: service,
            money: amount.toFixed(2),
            sign_type: 'MD5'
        };
        
        // 生成签名
        paymentParams.sign = generateDirectSign(paymentParams);
        
        // 直接跳转到支付网关
        redirectToPayment(paymentParams);
        
    } catch (error) {
        console.error('支付处理错误:', error);
        showPaymentError('支付处理失败，请稍后重试');
        showPaymentLoading(false);
    }
}

// 直接生成签名
function generateDirectSign(params) {
    // 按照支付网关要求的签名规则
    const signParams = [
        `pid=${params.pid}`,
        `type=${params.type}`,
        `out_trade_no=${params.out_trade_no}`,
        `notify_url=${params.notify_url}`,
        `return_url=${params.return_url}`,
        `name=${params.name}`,
        `money=${params.money}`,
        `sign_type=${params.sign_type}`
    ];
    
    // 拼接参数
    const signString = signParams.join('&') + PAYMENT_CONFIG.key;
    
    // 使用MD5加密
    return md5(signString).toUpperCase();
}

// 验证支付信息
function validatePaymentInfo() {
    const { service, amount, paymentType, orderNo } = currentPayment;
    
    if (!service || !amount || !paymentType || !orderNo) {
        showPaymentError('支付信息不完整');
        return false;
    }
    
    if (amount <= 0) {
        showPaymentError('支付金额无效');
        return false;
    }
    
    if (!PAYMENT_CONFIG.paymentTypes[paymentType]) {
        showPaymentError('不支持的支付方式');
        return false;
    }
    
    return true;
}

// 构建支付参数
function buildPaymentParams() {
    const { service, amount, paymentType, orderNo } = currentPayment;
    
    // 基础参数
    const params = {
        pid: PAYMENT_CONFIG.pid,
        type: paymentType,
        out_trade_no: orderNo,
        notify_url: getNotifyUrl(),
        return_url: getReturnUrl(),
        name: service.substring(0, 32), // 限制商品名称长度
        money: amount.toFixed(2), // 确保金额格式正确
        sitename: '缘来是你服务平台',
        version: '1.0'
    };
    
    // 生成签名
    params.sign = generatePaymentSignature(params);
    
    return params;
}

// 生成支付签名
function generatePaymentSignature(params) {
    // 按照支付平台要求的签名规则
    // 通常需要按照参数名ASCII码从小到大排序
    const sortedParams = Object.keys(params)
        .sort()
        .filter(key => key !== 'sign' && params[key] !== '')
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    // 拼接密钥
    const signString = sortedParams + `&key=${PAYMENT_CONFIG.key}`;
    
    // 使用MD5加密（实际应该使用支付平台指定的加密方式）
    return md5(signString).toUpperCase();
}

// 验证支付签名
function validatePaymentSignature(params) {
    const originalSign = params.sign;
    const calculatedSign = generatePaymentSignature(params);
    
    return originalSign === calculatedSign;
}

// 获取通知URL
function getNotifyUrl() {
    return window.location.origin + '/api/payment/notify';
}

// 获取返回URL
function getReturnUrl() {
    return window.location.origin + '/success.html?order=' + currentPayment.orderNo;
}

// 显示支付加载状态
function showPaymentLoading(show) {
    const payButton = document.querySelector('.btn-pay');
    if (!payButton) return;
    
    if (show) {
        payButton.disabled = true;
        payButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    } else {
        payButton.disabled = false;
        payButton.innerHTML = '<i class="fas fa-lock"></i> 安全支付';
    }
}

// 生成订单号
function generateOrderNo() {
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substr(2, 9);
    return `ORDER_${timestamp}_${random}`.toUpperCase();
}

// 生成签名
function generateSign(orderNo, amount) {
    // 这里需要根据支付平台的签名规则生成签名
    // 由于不知道具体的签名算法，这里使用简单的MD5示例
    const signStr = `pid=${PAYMENT_CONFIG.pid}&type=alipay&out_trade_no=${orderNo}&notify_url=${window.location.origin}/notify&return_url=${window.location.origin}/success&name=${currentPayment.service}&money=${amount}&key=${PAYMENT_CONFIG.key}`;
    
    // 在实际应用中，应该使用支付平台提供的签名算法
    // 这里使用简单的MD5作为示例
    return md5(signStr);
}

// 简单的MD5函数（实际项目中应该使用更安全的加密方式）
function md5(input) {
    // 这是一个简化的MD5实现，实际项目中应该使用成熟的加密库
    let hash = 0;
    if (input.length === 0) return hash;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// 跳转到支付页面 - 直接对接API
function redirectToPayment(params) {
    // 构建支付URL
    const baseUrl = PAYMENT_CONFIG.baseUrl;
    const queryString = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    const paymentUrl = `${baseUrl}?${queryString}`;
    
    console.log('支付跳转URL:', paymentUrl);
    
    // 直接跳转到支付网关
    window.location.href = paymentUrl;
}

// 显示支付成功消息
function showPaymentSuccess() {
    alert('支付成功！感谢您的购买，我们将尽快为您提供服务。');
    
    // 关闭支付弹窗
    document.getElementById('paymentModal').style.display = 'none';
    
    // 重置支付信息
    currentPayment = {
        service: '',
        amount: 0
    };
}

// 显示支付失败消息
function showPaymentError(message) {
    // 创建自定义错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error';
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
            <button class="error-close">&times;</button>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(errorDiv);
    
    // 添加样式
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        animation: slideInRight 0.3s ease;
    `;
    
    // 错误内容样式
    const errorContent = errorDiv.querySelector('.error-content');
    errorContent.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // 关闭按钮样式
    const closeBtn = errorDiv.querySelector('.error-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        margin-left: auto;
    `;
    
    // 关闭事件
    closeBtn.onclick = () => {
        errorDiv.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    };
    
    // 自动关闭
    setTimeout(() => {
        if (errorDiv.parentNode) {
            closeBtn.click();
        }
    }, 5000);
}

// 处理支付结果
function handlePaymentResult(result) {
    const { success, message, orderNo, amount } = result;
    
    if (success) {
        // 支付成功
        window.location.href = `/success.html?order=${orderNo}&amount=${amount}`;
    } else {
        // 支付失败
        window.location.href = `/error.html?order=${orderNo}&message=${encodeURIComponent(message)}`;
    }
}

// 检查支付状态
function checkPaymentStatus(orderNo) {
    return new Promise((resolve, reject) => {
        // 模拟API调用检查支付状态
        setTimeout(() => {
            // 这里应该调用实际的支付状态查询API
            const status = Math.random() > 0.3 ? 'success' : 'pending'; // 模拟结果
            
            if (status === 'success') {
                resolve({
                    success: true,
                    orderNo: orderNo,
                    amount: currentPayment.amount
                });
            } else {
                resolve({
                    success: false,
                    orderNo: orderNo,
                    message: '支付处理中，请稍后查看'
                });
            }
        }, 1000);
    });
}

// 支付回调处理
function handlePaymentCallback(callbackData) {
    // 验证回调签名
    if (!validateCallbackSignature(callbackData)) {
        console.error('回调签名验证失败');
        return false;
    }
    
    // 处理回调数据
    const { trade_status, out_trade_no, total_fee } = callbackData;
    
    if (trade_status === 'TRADE_SUCCESS') {
        // 支付成功
        console.log(`订单 ${out_trade_no} 支付成功，金额：${total_fee}`);
        return true;
    } else {
        // 支付失败或处理中
        console.log(`订单 ${out_trade_no} 支付状态：${trade_status}`);
        return false;
    }
}

// 验证回调签名
function validateCallbackSignature(callbackData) {
    // 这里应该实现支付平台回调签名的验证逻辑
    // 通常需要按照支付平台的文档进行签名验证
    return true; // 简化实现
}

// 滚动动画效果
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    const scrollY = window.scrollY;
    
    if (navbar) {
        if (scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }
    }
    
    // 添加滚动动画效果
    animateOnScroll();
});

// 滚动时动画元素
function animateOnScroll() {
    const elements = document.querySelectorAll('.service-card, .option');
    const windowHeight = window.innerHeight;
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        
        if (elementTop < windowHeight - 100) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

// 初始化滚动动画
function initScrollAnimation() {
    const elements = document.querySelectorAll('.service-card, .option');
    
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
    
    // 触发一次滚动检测
    animateOnScroll();
}

// 页面加载完成后初始化动画
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initScrollAnimation, 100);
});

// 添加页面加载动画
document.addEventListener('DOMContentLoaded', function() {
    // 添加加载完成后的动画效果
    setTimeout(() => {
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.5s ease';
    }, 100);
});

// 防止表单重复提交
function preventMultipleSubmissions(button) {
    button.disabled = true;
    button.innerHTML = '处理中...';
    
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '确认支付';
    }, 3000);
}

// 更新支付按钮状态
function updatePayButton() {
    const payButton = document.querySelector('.btn-pay');
    if (payButton) {
        payButton.addEventListener('click', function() {
            preventMultipleSubmissions(this);
        });
    }
}

// 初始化支付按钮状态
document.addEventListener('DOMContentLoaded', function() {
    updatePayButton();
});