CREATE INDEX transactions_platform_revenue_idx
  ON public.transactions (kind, created_at)
  INCLUDE (fee_usd)
  WHERE lower(status) IN ('completed', 'paid', 'succeeded', 'success');

CREATE OR REPLACE FUNCTION public.admin_platform_revenue_summary(
  _period_start timestamptz,
  _period_end timestamptz
)
RETURNS TABLE (
  transaction_kind text,
  lifetime_revenue numeric,
  period_revenue numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH revenue_kinds(transaction_kind) AS (
    VALUES ('funding'::text), ('send'::text), ('buy'::text), ('sell'::text)
  ),
  revenue AS (
    SELECT
      transactions.kind AS transaction_kind,
      sum(transactions.fee_usd) AS lifetime_revenue,
      sum(transactions.fee_usd) FILTER (
        WHERE transactions.created_at >= _period_start
          AND transactions.created_at < _period_end
      ) AS period_revenue
    FROM public.transactions AS transactions
    WHERE transactions.kind IN ('funding', 'send', 'buy', 'sell')
      AND lower(transactions.status) IN ('completed', 'paid', 'succeeded', 'success')
    GROUP BY transactions.kind
  )
  SELECT
    revenue_kinds.transaction_kind,
    COALESCE(revenue.lifetime_revenue, 0),
    COALESCE(revenue.period_revenue, 0)
  FROM revenue_kinds
  LEFT JOIN revenue USING (transaction_kind);
$$;

REVOKE ALL ON FUNCTION public.admin_platform_revenue_summary(timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_platform_revenue_summary(timestamptz, timestamptz)
  TO service_role;
