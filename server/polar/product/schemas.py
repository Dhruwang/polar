from typing import Annotated, Literal

from pydantic import UUID4, Discriminator, Field

from polar.benefit.schemas import BenefitPublic, BenefitSubscriber
from polar.kit.schemas import (
    EmptyStrToNoneValidator,
    Schema,
    TimestampedSchema,
)
from polar.models.product import SubscriptionTierType
from polar.models.product_price import ProductPriceRecurringInterval, ProductPriceType

PRODUCT_NAME_MIN_LENGTH = 3
PRODUCT_NAME_MAX_LENGTH = 24
PRODUCT_DESCRIPTION_MAX_LENGTH = 240

# Product

# Ref: https://stripe.com/docs/api/payment_intents/object#payment_intent_object-amount
MAXIMUM_PRICE_AMOUNT = 99999999


PriceAmount = Annotated[
    int, Field(..., gt=0, le=MAXIMUM_PRICE_AMOUNT, description="The price in cents.")
]
PriceCurrency = Annotated[
    str,
    Field(
        "usd",
        pattern="usd",
        description="The currency. Currently, only `usd` is supported.",
    ),
]
ProductName = Annotated[
    str,
    Field(
        min_length=PRODUCT_NAME_MIN_LENGTH,
        max_length=PRODUCT_NAME_MAX_LENGTH,
        description="The name of the product.",
    ),
]
ProductDescription = Annotated[
    str | None,
    Field(
        default=None,
        max_length=PRODUCT_DESCRIPTION_MAX_LENGTH,
        description="The description of the product.",
    ),
    EmptyStrToNoneValidator,
]


class ProductPriceRecurringCreate(Schema):
    """
    Schema to create a recurring product price, i.e. a subscription.
    """

    type: Literal[ProductPriceType.recurring]
    recurring_interval: ProductPriceRecurringInterval = Field(
        description="The recurring interval of the price."
    )
    price_amount: PriceAmount
    price_currency: PriceCurrency


class ProductPriceOneTimeCreate(Schema):
    """
    Schema to create a one-time product price.
    """

    type: Literal[ProductPriceType.one_time]
    price_amount: PriceAmount
    price_currency: PriceCurrency


ProductPriceCreate = Annotated[
    ProductPriceRecurringCreate | ProductPriceOneTimeCreate, Discriminator("type")
]


class ProductCreate(Schema):
    """
    Schema to create a product.
    """

    type: Literal[
        SubscriptionTierType.individual,
        SubscriptionTierType.business,
    ]
    name: ProductName
    description: ProductDescription = None
    is_highlighted: bool = False
    prices: list[ProductPriceCreate] = Field(
        ..., min_length=1, description="List of available prices for this product."
    )
    organization_id: UUID4 | None = Field(
        None,
        description=(
            "The ID of the organization owning the product. "
            "**Required unless you use an organization token.**"
        ),
    )


class ExistingProductPrice(Schema):
    """
    A price that already exists for this product.

    Useful when updating a product if you want to keep an existing price.
    """

    id: UUID4


class ProductUpdate(Schema):
    """
    Schema to update a product.
    """

    name: ProductName | None = None
    description: ProductDescription = None
    is_highlighted: bool | None = None
    is_archived: bool | None = Field(
        None,
        description=(
            "Whether the product is archived. "
            "If `true`, the product won't be available for purchase anymore. "
            "Existing customers will still have access to their benefits, "
            "and subscriptions will continue normally."
        ),
    )
    prices: list[ExistingProductPrice | ProductPriceCreate] | None = Field(
        default=None,
        description=(
            "List of available prices for this product. "
            "If you want to keep existing prices, include them in the list "
            "as an `ExistingProductPrice` object."
        ),
    )


class ProductBenefitsUpdate(Schema):
    """
    Schema to update the benefits granted by a product.
    """

    benefits: list[UUID4] = Field(
        description=(
            "List of benefit IDs. "
            "Each one must be on the same organization as the product."
        )
    )


class ProductPrice(TimestampedSchema):
    """
    A price for a product.
    """

    id: UUID4 = Field(description="The ID of the price.")
    type: ProductPriceType = Field(description="The type of the price.")
    recurring_interval: ProductPriceRecurringInterval | None = Field(
        None, description="The recurring interval of the price, if type is `recurring`."
    )
    price_amount: int = Field(description="The price in cents.")
    price_currency: str = Field(description="The currency.")
    is_archived: bool = Field(
        description="Whether the price is archived and no longer available."
    )


class ProductBase(TimestampedSchema):
    id: UUID4 = Field(description="The ID of the product.")
    type: SubscriptionTierType
    name: str = Field(description="The name of the product.")
    description: str | None = Field(None, description="The description of the product.")
    is_highlighted: bool
    is_archived: bool = Field(
        description="Whether the product is archived and no longer available."
    )
    organization_id: UUID4 = Field(
        description="The ID of the organization owning the product."
    )


class Product(ProductBase):
    """
    A product.
    """

    prices: list[ProductPrice] = Field(
        description="List of available prices for this product."
    )
    benefits: list[BenefitPublic] = Field(
        title="BenefitPublic", description="The benefits granted by the product."
    )


class ProductSubscriber(ProductBase):
    prices: list[ProductPrice] = Field(
        description="List of available prices for this product."
    )
    benefits: list[BenefitSubscriber] = Field(title="BenefitSubscriber")
