import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { CheckoutPage } from '../pages/CheckoutPage';
import { OrderTrackingPage } from '../pages/OrderTrackingPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { ProductCard } from '../components/ProductCard';
import { api, ApiError } from '../services/api';
import { MenuItem, Order, AdminOrder } from '../types';
import { OrderTimeline } from '../components/OrderTimeline';

const product: MenuItem = { id:'123456789012345678901234', name:'Audit Pizza', description:'Test food', price:10.1, category:'pizzas', imageUrl:'https://example.com/food.jpg', isAvailable:true, rating:4, prepTime:'10 min', isVeg:true };
const customer = {name:'QA Customer',phone:'9876543210',address:'42 QA Test Road'};
const order: Order = { id:'123456789012345678901235', orderNumber:'FD-20261014-AUDIT', items:[{productId:product.id,name:product.name,price:10.1,quantity:1,subtotal:10.1}],subtotal:10.1,deliveryFee:40,total:50.1,status:'ORDER_RECEIVED',timeline:[{status:'ORDER_RECEIVED',timestamp:new Date().toISOString()}],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString() };
const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api,'getPricing').mockResolvedValue({deliveryFee:40});
});
afterEach(() => { vi.useRealTimers(); });

describe('Audit checkout and persistence regressions', () => {
  it('restores a persisted cart after provider remount with exact totals', () => {
    const first = renderHook(() => useCart(), {wrapper});
    act(() => { first.result.current.addToCart(product); first.result.current.updateQuantity(product.id,3); });
    first.unmount();
    const second = renderHook(() => useCart(), {wrapper});
    expect(second.result.current.subtotal).toBe(30.3);
    expect(second.result.current.total).toBe(70.3);
    act(() => second.result.current.updateQuantity(product.id,Number.NaN));
    expect(second.result.current.items[0].quantity).toBe(3);
  });
  it('drops corrupted persisted products and invalid quantities', () => {
    localStorage.setItem('foodie_cart_items_v1',JSON.stringify([{product:{id:'bad',price:1},quantity:1},{product,quantity:1.5},{product,quantity:51}]));
    const {result} = renderHook(() => useCart(),{wrapper});
    expect(result.current.items).toEqual([]);
  });
  it('uses the configured server delivery fee', async () => {
    vi.mocked(api.getPricing).mockResolvedValue({deliveryFee:75});
    const {result} = renderHook(() => useCart(),{wrapper});
    act(() => result.current.addToCart(product));
    await waitFor(() => expect(result.current.total).toBe(85.1));
  });
  it('validates checkout, preserves cart on failure, reuses retry key, and confirms successful order', async () => {
    localStorage.setItem('foodie_cart_items_v1',JSON.stringify([{product,quantity:1}]));
    const create = vi.spyOn(api,'createOrder').mockRejectedValueOnce(new ApiError('Network unavailable',0)).mockResolvedValueOnce(order);
    render(<MemoryRouter initialEntries={['/checkout']}><CartProvider><Routes><Route path='/checkout' element={<CheckoutPage/>}/><Route path='/order-confirmed/:orderId' element={<p>Confirmed audit order</p>}/></Routes></CartProvider></MemoryRouter>);
    const submit = screen.getByRole('button',{name:/Place Order/i});
    fireEvent.click(submit);
    expect(create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText('e.g. Rahul Sharma'),{target:{value:'QA Customer'}});
    fireEvent.change(screen.getByPlaceholderText('e.g. 9876543210 or +91 9876543210'),{target:{value:'9876543210'}});
    fireEvent.change(screen.getByPlaceholderText('House/Flat number, Building name, Street name, Landmark, City'),{target:{value:'42 QA Test Road'}});
    fireEvent.click(submit);
    await screen.findByText('Network unavailable');
    expect(JSON.parse(localStorage.getItem('foodie_cart_items_v1')!)).toHaveLength(1);
    fireEvent.click(submit);
    await screen.findByText('Confirmed audit order');
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][1]).toBe(create.mock.calls[1][1]);
    expect(create.mock.calls[0][0]).toEqual({customer:customer,items:[{productId:product.id,quantity:1}]});
    expect(JSON.parse(localStorage.getItem('foodie_cart_items_v1')!)).toEqual([]);
  });
  it('reloads order tracking from its URL and shows delivered status', async () => {
    vi.spyOn(api,'getOrderById').mockResolvedValue({...order,status:'DELIVERED'});
    render(<MemoryRouter initialEntries={['/track/'+order.orderNumber]}><Routes><Route path='/track/:orderId' element={<OrderTrackingPage/>}/></Routes></MemoryRouter>);
    await screen.findByText(order.orderNumber);
    expect(api.getOrderById).toHaveBeenCalledWith(order.orderNumber);
    expect(screen.queryByRole('button',{name:'Advance Status'})).not.toBeInTheDocument();
  });
  it('does not auto-authenticate admin or display a built-in credential', () => {
    const get = vi.spyOn(api,'getAllOrders');
    render(<AdminOrdersPage/>);
    expect(screen.getByPlaceholderText('Enter Admin API Key')).toHaveValue('');
    expect(get).not.toHaveBeenCalled();
  });
  it('prevents duplicate checkout clicks while a request is pending', async () => {
    localStorage.setItem('foodie_cart_items_v1',JSON.stringify([{product,quantity:1}]));
    let resolve!: (value: Order) => void;
    const create = vi.spyOn(api,'createOrder').mockImplementation(() => new Promise(done => { resolve = done; }));
    render(<MemoryRouter><CartProvider><CheckoutPage/></CartProvider></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/Full Name/),{target:{value:customer.name}});
    fireEvent.change(screen.getByLabelText(/Mobile Phone Number/),{target:{value:customer.phone}});
    fireEvent.change(screen.getByLabelText(/Delivery Address/),{target:{value:customer.address}});
    const button = screen.getByRole('button',{name:/Place Order/});
    fireEvent.click(button); fireEvent.click(button);
    expect(create).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await act(async () => resolve(order));
  });
  it('preserves tracking details when a manual refresh fails', async () => {
    const read = vi.spyOn(api,'getOrderById').mockResolvedValueOnce(order).mockRejectedValueOnce(new ApiError('Temporary outage',0));
    render(<MemoryRouter initialEntries={['/track/'+order.orderNumber]}><Routes><Route path='/track/:orderId' element={<OrderTrackingPage/>}/></Routes></MemoryRouter>);
    await screen.findByText(order.orderNumber);
    fireEvent.click(screen.getByTitle('Refresh order status'));
    await screen.findByRole('alert');
    expect(screen.getByText(order.orderNumber)).toBeInTheDocument();
    expect(read).toHaveBeenCalledTimes(2);
  });
  it('reloads confirmation from a persisted server order without navigation state', async () => {
    vi.spyOn(api,'getOrderById').mockResolvedValue(order);
    render(<MemoryRouter initialEntries={['/order-confirmed/'+order.orderNumber]}><Routes><Route path='/order-confirmed/:orderId' element={<OrderConfirmationPage/>}/></Routes></MemoryRouter>);
    await screen.findByText('Order Successfully Placed');
    expect(api.getOrderById).toHaveBeenCalledWith(order.orderNumber);
  });
  it('uses a local fallback when a product image fails', () => {
    render(<CartProvider><ProductCard product={product}/></CartProvider>);
    const image = screen.getByAltText(product.name);
    fireEvent.error(image);
    expect(image.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
  });
  it('renders confirmation and tracking with the safe schema and no contact details', async () => {
    vi.spyOn(api,'getOrderById').mockResolvedValue(order);
    const confirmation = render(<MemoryRouter initialEntries={['/order-confirmed/'+order.orderNumber]}><Routes><Route path='/order-confirmed/:orderId' element={<OrderConfirmationPage/>}/></Routes></MemoryRouter>);
    await screen.findByText('Order Successfully Placed');
    expect(screen.getByText('Thank you for your order!')).toBeInTheDocument();
    for (const value of Object.values(customer)) expect(screen.queryByText(value)).not.toBeInTheDocument();
    expect(screen.queryByText('Delivery Address')).not.toBeInTheDocument();
    confirmation.unmount();
    render(<MemoryRouter initialEntries={['/track/'+order.id]}><Routes><Route path='/track/:orderId' element={<OrderTrackingPage/>}/></Routes></MemoryRouter>);
    await screen.findByText(order.orderNumber);
    expect(screen.getByText(product.name)).toBeInTheDocument();
    for (const value of Object.values(customer)) expect(screen.queryByText(value)).not.toBeInTheDocument();
    expect(screen.queryByText('Delivery Recipient')).not.toBeInTheDocument();
  });
  it('ignores free-form staff notes in the public timeline even if stale data includes them', () => {
    const legacyTimeline = [{status: 'ORDER_RECEIVED' as const, timestamp:order.createdAt,note:customer.phone+' '+customer.address}];
    render(<OrderTimeline currentStatus='ORDER_RECEIVED' timeline={legacyTimeline}/>);
    expect(screen.queryByText(legacyTimeline[0].note)).not.toBeInTheDocument();
    expect(screen.getByText('We have received your order and sent it to the kitchen.')).toBeInTheDocument();
  });
  it('shows contact details only after authorized admin login and can update status', async () => {
    const adminOrder: AdminOrder = {...order,customer};
    const list = vi.spyOn(api,'getAllOrders').mockResolvedValue({orders:[adminOrder],total:1});
    const update = vi.spyOn(api,'updateOrderStatus').mockResolvedValue({...adminOrder,status:'PREPARING'});
    render(<AdminOrdersPage/>);
    expect(list).not.toHaveBeenCalled();
    for (const value of Object.values(customer)) expect(screen.queryByText(value)).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Enter Admin API Key'),{target:{value:'test-only-admin-login'}});
    fireEvent.click(screen.getByRole('button',{name:'Authenticate Portal'}));
    await screen.findByText(customer.phone);
    expect(screen.getByText(customer.address)).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith('test-only-admin-login');
    fireEvent.change(screen.getByRole('combobox'),{target:{value:'PREPARING'}});
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('PREPARING'));
    expect(update).toHaveBeenCalledWith(order.id,'PREPARING','test-only-admin-login');
  });
  it('polls changed statuses, retains last-known details on outage, recovers and stops polling at delivery', async () => {
    vi.useFakeTimers();
    const preparing: Order = {...order,status:'PREPARING',timeline:[...order.timeline,{status:'PREPARING',timestamp:new Date().toISOString()}]};
    const delivered: Order = {...preparing,status:'DELIVERED',timeline:[...preparing.timeline,{status:'OUT_FOR_DELIVERY',timestamp:new Date().toISOString()},{status:'DELIVERED',timestamp:new Date().toISOString()}]};
    const read = vi.spyOn(api,'getOrderById').mockResolvedValueOnce(order).mockResolvedValueOnce(preparing).mockRejectedValueOnce(new ApiError('Temporary outage',0)).mockResolvedValueOnce(delivered);
    render(<MemoryRouter initialEntries={['/track/'+order.orderNumber]}><Routes><Route path='/track/:orderId' element={<OrderTrackingPage/>}/></Routes></MemoryRouter>);
    await act(async () => {});
    expect(screen.getByText(order.orderNumber)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(read).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Our gourmet chefs are cooking your fresh meal.')).toBeInTheDocument();
    expect(screen.getByText('Preparing').closest('[aria-current="step"]')).toBeInTheDocument();
    // Timestamp history grows on the successful status change.
    expect(document.querySelectorAll('span.self-start')).toHaveLength(2);
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.getByRole('alert')).toHaveTextContent('Showing last known status');
    expect(screen.getByText(order.orderNumber)).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(5000); });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Refresh Status'})).toBeInTheDocument();
    expect(screen.getByText('Delivered').closest('[aria-current="step"]')).toBeInTheDocument();
    expect(document.querySelectorAll('span.self-start')).toHaveLength(4);
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(read).toHaveBeenCalledTimes(4);
    expect(screen.queryByRole('button',{name:'Advance Status'})).not.toBeInTheDocument();
  });
});
