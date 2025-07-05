export const calculateScreenTotals = (order) => {
  const requirements = order.order_screen_requirements || [];

  let totalSqm = 0;
  let totalPanels = 0;

  requirements.forEach(req => {
    const rows = parseInt(req.dimensions_rows || 0, 10);
    const cols = parseInt(req.dimensions_columns || 0, 10);
    const sqm = parseFloat(req.sqm_required || 0);

    if (!isNaN(sqm)) totalSqm += sqm;
    if (!isNaN(rows) && !isNaN(cols)) totalPanels += rows * cols;
  });

  return {
    totalSqm,
    totalPanels
  };
};
