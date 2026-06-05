"""API endpoints for pricing/markup data used by the dashboard."""

from decimal import Decimal

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from part.models import Part, PartPricing


class PricingDashboardData(APIView):
    """Returns pricing and markup data for the pricing dashboard.

    Aggregates PartPricing data across all parts that have stock on hand,
    computing total retail value, total stock cost, overall markup percentage,
    and the top 5 parts by markup.
    """

    queryset = Part.objects.none()  # Required for DRF ModelPermission
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Handle GET request — return aggregated pricing and markup data."""
        # Gather all parts that have stock items
        parts = (
            Part.objects
            .filter(stock_items__quantity__gt=0)
            .distinct()
            .prefetch_related('pricing_data')
            .only('pk', 'name')
        )

        total_retail_value = Decimal('0.00')
        total_stock_cost = Decimal('0.00')
        part_markups = []

        for part in parts:
            try:
                pricing = part.pricing_data
            except PartPricing.DoesNotExist:
                continue

            if pricing.overall_min is None and pricing.sale_price_max is None:
                continue

            stock_qty = part.total_stock

            if stock_qty is None or stock_qty <= 0:
                continue

            cost_val = None
            retail_val = None

            if pricing.overall_min is not None:
                cost_val = pricing.overall_min.amount * stock_qty
                total_stock_cost += cost_val

            if pricing.sale_price_max is not None:
                retail_val = pricing.sale_price_max.amount * stock_qty
                total_retail_value += retail_val

            # If sale price not available, estimate from cost + default markup
            if retail_val is None and cost_val is not None:
                retail_val = cost_val * Decimal('1.25')
                total_retail_value += retail_val
            elif retail_val is None:
                continue

            if cost_val is not None and cost_val > 0:
                markup = ((retail_val - cost_val) / cost_val) * Decimal('100')
                part_markups.append({
                    'name': part.name,
                    'markup_pct': float(round(markup, 1)),
                    'retail_value': float(round(retail_val, 2)),
                })

        # Sort by markup descending, take top 5
        part_markups.sort(key=lambda x: x['markup_pct'], reverse=True)
        top_parts = part_markups[:5]

        overall_markup_pct = 0.0
        if total_stock_cost > 0:
            overall_markup_pct = float(
                round(
                    ((total_retail_value - total_stock_cost) / total_stock_cost)
                    * Decimal('100'),
                    1,
                )
            )

        return Response({
            'total_retail_value': float(round(total_retail_value, 2)),
            'total_stock_cost': float(round(total_stock_cost, 2)),
            'overall_markup_pct': overall_markup_pct,
            'top_parts': top_parts,
        })
