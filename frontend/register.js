const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("register-form");
const message = document.getElementById("register-message");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        message.textContent = "نام کاربری و رمز عبور را وارد کنید.";
        return;
    }

    if (password.length < 6) {
        message.textContent = "رمز عبور باید حداقل ۶ کاراکتر باشد.";
        return;
    }

    message.textContent = "در حال ثبت‌نام...";

    try {
        const response = await fetch(`${API_BASE}/api/register/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.username) {
                message.textContent = data.username[0];
            } else if (data.password) {
                message.textContent = data.password[0];
            } else if (data.detail) {
                message.textContent = data.detail;
            } else {
                message.textContent = "ثبت‌نام انجام نشد.";
            }

            return;
        }

        localStorage.setItem("lia_token", data.token);
        localStorage.setItem("lia_user_id", data.user_id);
        localStorage.setItem("lia_username", data.username);

        message.textContent = "ثبت‌نام با موفقیت انجام شد.";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);

    } catch (error) {
        console.error(error);
        message.textContent = "ارتباط با سرور برقرار نشد.";
    }
});