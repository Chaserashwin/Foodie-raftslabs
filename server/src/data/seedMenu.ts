export interface SeedMenuItem {
  name: string;
  description: string;
  price: number;
  category: 'pizzas' | 'burgers' | 'sides' | 'beverages';
  imageUrl: string;
  isAvailable: boolean;
  rating: number;
  prepTime: string;
  isVeg: boolean;
}

// Narrow repair for the two previously seeded image URLs that return HTTP 404.
export const LEGACY_IMAGE_REPLACEMENTS = [
  ['https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80'],
  ['https://images.unsplash.com/photo-1639024471287-035186f55b1c?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80'],
] as const;

export const SEED_MENU_ITEMS: SeedMenuItem[] = [
  // PIZZAS
  {
    name: 'Margherita Fresca Pizza',
    description: 'Classic artisanal sourdough base topped with San Marzano tomato sauce, fresh buffalo mozzarella, and fragrant sweet basil leaves.',
    price: 349,
    category: 'pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.8,
    prepTime: '20-25 min',
    isVeg: true,
  },
  {
    name: 'Fiery Pepperoni & Jalapeno Pizza',
    description: 'Hand-stretched crust topped with spicy smoked pepperoni slices, pickled jalapenos, rich mozzarella, and hot honey drizzle.',
    price: 499,
    category: 'pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.9,
    prepTime: '20-25 min',
    isVeg: false,
  },
  {
    name: 'Truffle Mushroom & Smoked Cheese Pizza',
    description: 'Wild forest button mushrooms, black truffle oil infusion, caramelized onions, smoked scamorza, and thyme.',
    price: 469,
    category: 'pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.7,
    prepTime: '20-25 min',
    isVeg: true,
  },
  {
    name: 'BBQ Pulled Chicken Pizza',
    description: 'Slow-cooked hickory BBQ shredded chicken breast, bell peppers, sweet corn, and red onions with a four-cheese blend.',
    price: 479,
    category: 'pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.6,
    prepTime: '22-28 min',
    isVeg: false,
  },

  // BURGERS
  {
    name: 'Classic Smash Cheeseburger',
    description: 'Double seared beef-style tender smash patty, melted aged cheddar cheese, dill pickles, and signature house burger sauce on toasted brioche.',
    price: 299,
    category: 'burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.9,
    prepTime: '15-20 min',
    isVeg: false,
  },
  {
    name: 'Crispy Korean Fried Chicken Burger',
    description: 'Buttermilk fried chicken tossed in sweet spicy gochujang glaze, topped with sesame purple cabbage slaw in a brioche bun.',
    price: 329,
    category: 'burgers',
    imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.8,
    prepTime: '15-20 min',
    isVeg: false,
  },
  {
    name: 'Crispy Paneer & Jalapeno Crunch Burger',
    description: 'Golden spiced paneer steak crusted with panko crumbs, cheddar slice, jalapeno popper cream, and fresh romaine lettuce.',
    price: 279,
    category: 'burgers',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.7,
    prepTime: '12-18 min',
    isVeg: true,
  },
  {
    name: 'Smoky Veggie Supreme Burger',
    description: 'Black bean and quinoa patty infused with smoked chipotle, sliced avocado, ripe vine tomatoes, and garlic aioli.',
    price: 259,
    category: 'burgers',
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.5,
    prepTime: '12-16 min',
    isVeg: true,
  },

  // SIDES
  {
    name: 'Truffle Parmesan Hand-Cut Fries',
    description: 'Crispy twice-cooked skin-on Idaho potatoes tossed in white truffle oil, grated aged parmesan, and freshly chopped chives.',
    price: 189,
    category: 'sides',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.8,
    prepTime: '10-15 min',
    isVeg: true,
  },
  {
    name: 'Spicy Peri-Peri Chicken Wings (6 pcs)',
    description: 'Crisp roasted chicken wings glazed with fiery house-made African bird\'s eye chili sauce, served with cool ranch dip.',
    price: 269,
    category: 'sides',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.7,
    prepTime: '15-20 min',
    isVeg: false,
  },
  {
    name: 'Cheesy Garlic Pull-Apart Bread',
    description: 'Freshly baked artisanal loaf filled with roasted garlic herb butter and oozing mozzarella strings.',
    price: 219,
    category: 'sides',
    imageUrl: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.9,
    prepTime: '12-16 min',
    isVeg: true,
  },
  {
    name: 'Crispy Onion Blossom Rings',
    description: 'Sweet Spanish yellow onions sliced thick, beer-battered to crunchy perfection, dusted with smoked paprika.',
    price: 169,
    category: 'sides',
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.5,
    prepTime: '10-14 min',
    isVeg: true,
  },

  // BEVERAGES
  {
    name: 'Classic Cold Brew Reserve',
    description: 'Single-origin Arabica beans steeped for 20 hours in cold filtered water, served over crystal clear ice spheres.',
    price: 159,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.8,
    prepTime: '3-5 min',
    isVeg: true,
  },
  {
    name: 'Handcrafted Passionfruit Mint Fizz',
    description: 'Real tropical passionfruit pulp, fresh garden mint, Persian lime juice, and sparkling soda water.',
    price: 149,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.7,
    prepTime: '4-6 min',
    isVeg: true,
  },
  {
    name: 'Dark Belgian Chocolate Thickshake',
    description: 'Pure 70% dark chocolate ganache blended with premium dairy vanilla bean gelato and dark chocolate shavings.',
    price: 199,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.9,
    prepTime: '5-8 min',
    isVeg: true,
  },
  {
    name: 'Freshly Brewed Peach Iced Tea',
    description: 'Ceylon black tea infused with natural peach puree, squeezed lemon, and a hint of wildflower honey.',
    price: 129,
    category: 'beverages',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    rating: 4.6,
    prepTime: '3-5 min',
    isVeg: true,
  },
];
