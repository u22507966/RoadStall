import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { StockTakeClass } from './stock-take/stock-take';
import { Sales } from './sales/sales';
import { Products } from './products/products';
import { User } from './user/user';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'dashboard', component: Dashboard },
    { path: 'stock-take', component: StockTakeClass },
    { path: 'sales', component: Sales },
    { path: 'products', component: Products },
    {path: 'user', component: User}
];