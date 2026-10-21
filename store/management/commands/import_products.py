import time
from io import BytesIO

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from PIL import Image

from store.models import Product, ProductImage


BASE_URL = "https://liateam.ir"
API_URL = f"{BASE_URL}/api/v1/client/product/product-groups"

BATCH_SIZE = 25
MAX_RETRIES = 3
RETRY_DELAY = 4


class Command(BaseCommand):
    help = "Import products from the official Liateam API"

    def handle(self, *args, **options):
        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "شروع دریافت محصولات از API رسمی Liateam..."
            )
        )
        self.stdout.write("")

        session = requests.Session()

        session.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/140.0 Safari/537.36"
                ),
                "Accept": "application/json",
            }
        )

        products = self.fetch_products(session)

        if products is None:
            self.stdout.write("")
            self.stdout.write(
                self.style.ERROR(
                    "دریافت محصولات از API موفق نبود."
                )
            )
            self.stdout.write(
                "هیچ اطلاعاتی از دیتابیس حذف یا جایگزین نشد."
            )
            return

        if not products:
            self.stdout.write(
                self.style.WARNING(
                    "API محصولی برنگرداند."
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"تعداد محصولات دریافت‌شده: {len(products)}"
            )
        )
        self.stdout.write("")

        imported = 0
        created = 0
        updated = 0
        failed = 0
        images_updated = 0

        for index, data in enumerate(products, start=1):
            try:
                result = self.import_product(
                    session=session,
                    data=data,
                )

                if result["created"]:
                    created += 1
                    action = "ایجاد"
                else:
                    updated += 1
                    action = "به‌روزرسانی"

                if result["image_updated"]:
                    images_updated += 1

                imported += 1

                self.stdout.write(
                    self.style.SUCCESS(
                        f"[{index}/{len(products)}] "
                        f"{action}: "
                        f"{result['name']} "
                        f"(code={result['source_product_id']})"
                    )
                )

            except Exception as exc:
                failed += 1

                self.stdout.write(
                    self.style.ERROR(
                        f"[{index}/{len(products)}] "
                        f"خطا: {exc}"
                    )
                )

        self.stdout.write("")
        self.stdout.write("=" * 60)
        self.stdout.write(
            self.style.SUCCESS(
                "پایان import"
            )
        )
        self.stdout.write(
            f"موفق: {imported}"
        )
        self.stdout.write(
            f"ایجاد جدید: {created}"
        )
        self.stdout.write(
            f"به‌روزرسانی: {updated}"
        )
        self.stdout.write(
            f"تصاویر به‌روزشده: {images_updated}"
        )
        self.stdout.write(
            f"خطادار: {failed}"
        )
        self.stdout.write("=" * 60)

    # ---------------------------------------------------------
    # API
    # ---------------------------------------------------------

    def fetch_products(self, session):
        """
        دریافت محصولات از API رسمی.

        ابتدا یک درخواست page_size بزرگ امتحان می‌شود.
        اگر موفق نبود، API به صورت batch با codes درخواست می‌شود.
        """

        products = self.fetch_all_products(
            session=session
        )

        if products is not None:
            return products

        self.stdout.write(
            self.style.WARNING(
                "دریافت یک‌جای محصولات موفق نبود."
            )
        )

        return self.fetch_products_by_codes(
            session=session
        )

    def fetch_all_products(self, session):
        """
        تلاش برای دریافت همه محصولات در یک درخواست.
        """

        params = {
            "page": 1,
            "page_size": 100000,
        }

        response = self.request_json(
            session=session,
            params=params,
            description="دریافت لیست محصولات",
        )

        if response is None:
            return None

        data = response.get("data")

        if not isinstance(data, dict):
            return None

        product_list = data.get("list")

        if not isinstance(product_list, list):
            return None

        return product_list

    def fetch_products_by_codes(self, session):
        """
        fallback:
        ابتدا یک لیست از محصولات موجود در پاسخ API می‌گیرد
        و سپس در batchهای کوچک‌تر اطلاعات را دریافت می‌کند.
        """

        initial_params = {
            "page": 1,
            "page_size": 100000,
        }

        response = self.request_json(
            session=session,
            params=initial_params,
            description="دریافت کدهای محصولات",
        )

        if response is None:
            return None

        data = response.get("data")

        if not isinstance(data, dict):
            return None

        product_list = data.get("list")

        if not isinstance(product_list, list):
            return None

        codes = []

        for item in product_list:
            if not isinstance(item, dict):
                continue

            code = item.get("code")

            if code is not None:
                codes.append(str(code))

        if not codes:
            return []

        all_products = []

        for start in range(
            0,
            len(codes),
            BATCH_SIZE,
        ):
            batch = codes[
                start:start + BATCH_SIZE
            ]

            codes_value = ",".join(batch)

            self.stdout.write(
                f"دریافت batch "
                f"{start + 1}-"
                f"{min(start + BATCH_SIZE, len(codes))}"
                f" از {len(codes)}"
            )

            response = self.request_json(
                session=session,
                params={
                    "codes": codes_value,
                },
                description="دریافت batch محصولات",
            )

            if response is None:
                self.stdout.write(
                    self.style.WARNING(
                        "این batch دریافت نشد؛ "
                        "از آن عبور می‌کنیم."
                    )
                )
                continue

            data = response.get("data")

            if not isinstance(data, dict):
                continue

            batch_products = data.get("list")

            if isinstance(
                batch_products,
                list,
            ):
                all_products.extend(
                    batch_products
                )

            time.sleep(1)

        return self.deduplicate_products(
            all_products
        )

    def request_json(
        self,
        session,
        params,
        description,
    ):
        """
        درخواست GET با retry و backoff.
        """

        for attempt in range(
            1,
            MAX_RETRIES + 1,
        ):
            try:
                response = session.get(
                    API_URL,
                    params=params,
                    timeout=60,
                )

                if response.status_code == 200:
                    payload = response.json()

                    if payload.get("success") is True:
                        return payload

                    self.stdout.write(
                        self.style.WARNING(
                            f"{description}: "
                            "API پاسخ موفق برنگرداند."
                        )
                    )

                    return None

                self.stdout.write(
                    self.style.WARNING(
                        f"{description}: "
                        f"HTTP {response.status_code} "
                        f"(attempt {attempt}/{MAX_RETRIES})"
                    )
                )

            except (
                requests.RequestException,
                ValueError,
            ) as exc:
                self.stdout.write(
                    self.style.WARNING(
                        f"{description}: "
                        f"{exc} "
                        f"(attempt {attempt}/{MAX_RETRIES})"
                    )
                )

            if attempt < MAX_RETRIES:
                time.sleep(
                    RETRY_DELAY * attempt
                )

        return None

    # ---------------------------------------------------------
    # Product
    # ---------------------------------------------------------

    def import_product(
        self,
        session,
        data,
    ):
        source_product_id = self.get_source_id(
            data
        )

        if source_product_id is None:
            raise ValueError(
                "محصول بدون code/product_code"
            )

        name = self.clean_text(
            data.get("title")
        )

        if not name:
            name = f"محصول {source_product_id}"

        price = self.to_int(
            data.get("price")
        )

        measurement_value = self.clean_text(
            data.get("measurement_value")
        )

        measurement_type = self.clean_text(
            data.get("measurement_type")
        )

        inventory = data.get(
            "inventory"
        )

        stock = self.extract_stock(
            inventory
        )

        is_available = self.extract_availability(
            inventory
        )

        status = self.get_status(
            stock=stock,
            is_available=is_available,
        )

        existing = Product.objects.filter(
            source_product_id=source_product_id
        ).first()

        if existing:
            product = existing
            created = False
        else:
            product = Product(
                source_product_id=source_product_id
            )
            created = True

        product.name = name
        product.consumer_price = price

        # manufacturer_price فعلاً در این endpoint
        # به صورت مستقل ارائه نشده است.
        #
        # بنابراین مقدار قبلی را حفظ می‌کنیم و
        # برای محصول جدید صفر باقی می‌ماند.
        #
        # این کار بهتر از ساختن قیمت جعلی است.

        product.stock = stock
        product.status = status

        specifications = dict(
            product.specifications or {}
        )

        if measurement_value:
            specifications[
                "measurement_value"
            ] = measurement_value

        if measurement_type:
            specifications[
                "measurement_type"
            ] = measurement_type

        category_codes = data.get(
            "category_codes"
        )

        if isinstance(
            category_codes,
            list,
        ):
            specifications[
                "source_category_codes"
            ] = category_codes

        product.specifications = specifications

        # در این endpoint توضیحات جداگانه‌ای
        # برای محصول نداریم؛ توضیح قبلی را پاک نمی‌کنیم.
        product.save()

        image_url = self.clean_text(
            data.get("home_page_image")
        )

        image_updated = False

        if image_url:
            image_updated = self.update_product_image(
                session=session,
                product=product,
                image_url=image_url,
            )

        return {
            "created": created,
            "name": product.name,
            "source_product_id": source_product_id,
            "image_updated": image_updated,
        }

    # ---------------------------------------------------------
    # Product helpers
    # ---------------------------------------------------------

    def get_source_id(self, data):
        value = data.get("code")

        if value is None:
            value = data.get(
                "product_code"
            )

        if value is None:
            return None

        try:
            return int(value)
        except (
            TypeError,
            ValueError,
        ):
            return None

    def clean_text(self, value):
        if value is None:
            return ""

        return str(value).strip()

    def to_int(self, value):
        if value is None:
            return 0

        if isinstance(
            value,
            bool,
        ):
            return int(value)

        try:
            return int(
                float(
                    str(value)
                    .replace(",", "")
                    .replace("٬", "")
                    .strip()
                )
            )
        except (
            TypeError,
            ValueError,
        ):
            return 0

    def extract_stock(self, inventory):
        if not isinstance(
            inventory,
            dict,
        ):
            return 0

        total_inventory = inventory.get(
            "total_inventory"
        )

        if total_inventory is not None:
            return max(
                self.to_int(
                    total_inventory
                ),
                0,
            )

        inventories = inventory.get(
            "inventories"
        )

        if not isinstance(
            inventories,
            list,
        ):
            return 0

        total = 0

        for item in inventories:
            if not isinstance(
                item,
                dict,
            ):
                continue

            quantity = (
                item.get("inventory")
                or item.get("quantity")
                or item.get("stock")
            )

            total += max(
                self.to_int(quantity),
                0,
            )

        return total

    def extract_availability(self, inventory):
        if not isinstance(
            inventory,
            dict,
        ):
            return None

        value = inventory.get(
            "is_available"
        )

        if value is None:
            return None

        return bool(value)

    def get_status(
        self,
        stock,
        is_available,
    ):
        if stock > 0:
            return "available"

        if is_available is True:
            return "available"

        return "out_of_stock"

    def deduplicate_products(self, products):
        result = {}

        for product in products:
            if not isinstance(
                product,
                dict,
            ):
                continue

            source_id = self.get_source_id(
                product
            )

            if source_id is None:
                continue

            result[source_id] = product

        return list(
            result.values()
        )

    # ---------------------------------------------------------
    # Images
    # ---------------------------------------------------------

    def update_product_image(
        self,
        session,
        product,
        image_url,
    ):
        """
        تصویر جدید ابتدا دانلود و اعتبارسنجی می‌شود.
        فقط اگر موفق بود، تصویر قبلی جایگزین می‌شود.
        """

        try:
            response = session.get(
                image_url,
                timeout=60,
            )

            response.raise_for_status()

            content = response.content

        except requests.RequestException as exc:
            self.stdout.write(
                self.style.WARNING(
                    f"تصویر دریافت نشد برای "
                    f"{product.name}: {exc}"
                )
            )
            return False

        valid, image_format = (
            self.validate_image(
                content
            )
        )

        if not valid:
            self.stdout.write(
                self.style.WARNING(
                    f"تصویر نامعتبر برای "
                    f"{product.name}"
                )
            )
            return False

        extension = self.get_extension(
            image_format
        )

        filename = (
            f"source-"
            f"{product.source_product_id}"
            f"{extension}"
        )

        old_image_name = (
            product.image.name
            if product.image
            else None
        )

        # تصاویر gallery قدیمی این محصول
        # را فقط وقتی تصویر جدید معتبر داریم
        # پاک می‌کنیم.
        ProductImage.objects.filter(
            product=product
        ).delete()

        if product.image:
            product.image.delete(
                save=False
            )

        product.image.save(
            filename,
            ContentFile(content),
            save=True,
        )

        ProductImage.objects.create(
            product=product,
            image=product.image.name,
            is_main=True,
        )

        # اگر تصویر قبلی اسم متفاوتی داشته باشد،
        # delete بالا معمولاً آن را پاک می‌کند.
        # متغیر فقط برای خوانایی نگه داشته شده.
        _ = old_image_name

        return True

    def validate_image(self, content):
        try:
            image = Image.open(
                BytesIO(content)
            )

            image_format = (
                image.format or ""
            ).upper()

            if image_format not in [
                "JPEG",
                "PNG",
                "WEBP",
            ]:
                return False, None

            width, height = image.size

            if width < 300 or height < 300:
                return False, None

            return True, image_format

        except Exception:
            return False, None

    def get_extension(self, image_format):
        extensions = {
            "JPEG": ".jpg",
            "PNG": ".png",
            "WEBP": ".webp",
        }

        return extensions.get(
            image_format,
            ".jpg",
        )
