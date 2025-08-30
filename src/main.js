/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { discount, sale_price, quantity } = purchase;
  const discountFactor = 1 - discount / 100;
  const revenue = sale_price * quantity * discountFactor;
  return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

const bonusPercentFirst = 0.15;
const bonusPercentSecondThird = 0.1;
const bonusPercentOther = 0.05;
const bonusPercentLast = 0;

function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const { profit } = seller;
  if (index === 0) {
    return +(profit * bonusPercentFirst).toFixed(2);
  } else if (index === 1 || index === 2) {
    return +(profit * bonusPercentSecondThird).toFixed(2);
  } else if (index === total - 1) {
    return 0;
  } else {
    return +(profit * bonusPercentOther).toFixed(2);
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
 function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  // Проверка данных
 if (!data) {
  throw new Error("Данные отсутствуют");
}

  const assertArray = (name, arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`Некорректные входные данные: ${name} должен быть непустым массивом`);
    }
  };

  assertArray("sellers", data.sellers);
  assertArray("products", data.products);
  assertArray("purchase_records", data.purchase_records);

    // Проверка опций
  if (!options || typeof options !== "object") {
    throw new Error("Опции отсутствуют или неверного типа");
  }

  const { calculateRevenue, calculateBonus } = options;

  if (typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
    throw new Error("В опциях должны быть функции calculateRevenue и calculateBonus");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа

  const sellerIndex = sellerStats.reduce((acc, seller) => {
    acc[seller.id] = seller;
    return acc;
  }, {});

  const productIndex = data.products.reduce((acc, product) => {
    acc[product.sku] = product;
    return acc;
  }, {});

  // @TODO: Расчет выручки и прибыли для каждого продавца

  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;
    seller.sales_count += 1;
    seller.revenue += record.total_amount;
    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;
      const cost = product.purchase_price * item.quantity;
      const revenue = calculateRevenue(item, product);
      const profit = revenue - cost;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования

  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sellerStats.length, seller);
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями

  return sellerStats.map((seller) => ({
    seller_id: String(seller.id),
    name: String(seller.name),
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));
}