from enum import StrEnum
from typing import TYPE_CHECKING, cast
from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from polar.kit.db.models import RecordModel
from polar.kit.extensions.sqlalchemy import PostgresUUID
from polar.models.benefit import BenefitArticles, BenefitType

if TYPE_CHECKING:
    from polar.models import Benefit, Organization, ProductBenefit, ProductPrice


class SubscriptionTierType(StrEnum):
    free = "free"
    individual = "individual"
    business = "business"


class Product(RecordModel):
    __tablename__ = "products"

    __table_args__ = (Index("idx_organization_id_type", "organization_id", "type"),)

    type: Mapped[SubscriptionTierType] = mapped_column(
        String, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_highlighted: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, index=True
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    stripe_product_id: Mapped[str | None] = mapped_column(
        String, nullable=True, index=True
    )

    organization_id: Mapped[UUID] = mapped_column(
        PostgresUUID,
        ForeignKey("organizations.id", ondelete="cascade"),
        nullable=False,
    )

    @declared_attr
    def organization(cls) -> Mapped["Organization"]:
        return relationship("Organization", lazy="raise")

    @declared_attr
    def all_prices(cls) -> Mapped[list["ProductPrice"]]:
        # Prices are almost always needed, so eager loading makes sense
        return relationship("ProductPrice", lazy="raise", back_populates="product")

    @declared_attr
    def prices(cls) -> Mapped[list["ProductPrice"]]:
        # Prices are almost always needed, so eager loading makes sense
        return relationship(
            "ProductPrice",
            lazy="selectin",
            primaryjoin=(
                "and_("
                "ProductPrice.product_id == Product.id, "
                "ProductPrice.is_archived.is_(False)"
                ")"
            ),
            viewonly=True,
        )

    product_benefits: Mapped[list["ProductBenefit"]] = relationship(
        # Benefits are almost always needed, so eager loading makes sense
        lazy="selectin",
        order_by="ProductBenefit.order",
        cascade="all, delete-orphan",
    )

    benefits: AssociationProxy[list["Benefit"]] = association_proxy(
        "product_benefits", "benefit"
    )

    @property
    def is_tax_applicable(self) -> bool:
        if len(self.prices) == 0:
            return False

        for benefit in self.benefits:
            if benefit.is_tax_applicable:
                return True

        return False

    def get_stripe_name(self) -> str:
        return f"{self.organization.name} - {self.name}"

    def get_articles_benefit(self) -> BenefitArticles | None:
        for benefit in self.benefits:
            if benefit.type == BenefitType.articles:
                return cast(BenefitArticles, benefit)
        return None

    def get_price(self, id: UUID) -> "ProductPrice | None":
        for price in self.prices:
            if price.id == id:
                return price
        return None
