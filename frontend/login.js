const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("login-form");
const message = document.getElementById("login-message");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "در حال ورود...";

    try {
        const response = await fetch(`${API_BASE}/api/login/`, {
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
            message.textContent =
                data.detail ||
                data.non_field_errors?.[0] ||
                "نام کاربری یا رمز عبور اشتباه است.";
            return;
        }

        localStorage.setItem("lia_token", data.token);
        localStorage.setItem("lia_user_id", data.user_id);
        localStorage.setItem("lia_username", data.username);

        message.textContent = "ورود با موفقیت انجام شد.";

        setTimeout(() => {
            window.location.href = "index.html";
        }, 500);

    } catch (error) {
        console.error(error);
        message.textContent =
            "ارتباط با سرور برقرار نشد.";
    }
});
