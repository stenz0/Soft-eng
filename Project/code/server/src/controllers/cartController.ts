import {User, Role} from "../components/user";
import CartDAO from "../dao/cartDAO";
import ProductDAO from "../dao/productDAO";
import { Product } from "../components/product";
import { Cart, ProductInCart} from "../components/cart";
import {UserNotCustomerError} from "../errors/userError";
import {EmptyProductStockError, LowProductStockError} from "../errors/productError"
import { CartNotFoundError, EmptyCartError, ProductNotInCartError} from "../errors/cartError";
/**
 * Represents a controller for managing shopping carts.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class CartController {
    private dao: CartDAO
    private productDao: ProductDAO

    constructor() {
        this.dao = new CartDAO
        this.productDao = new ProductDAO
    }

    /**
     * Adds a product to the user's cart. If the product is already in the cart, the quantity should be increased by 1.
     * If the product is not in the cart, it should be added with a quantity of 1.
     * If there is no current unpaid cart in the database, then a new cart should be created.
     * @param user - The user to whom the product should be added.
     * @param productId - The model of the product to add.
     * @returns A Promise that resolves to `true` if the product was successfully added.
     */
    async addToCart(user: User, model: string): Promise<Boolean> { 
        //if(user.role !== Role.CUSTOMER)
        //    throw new UserNotCustomerError

        const newProduct: Product = await this.productDao.getProductByModel(model)
        if(newProduct.quantity < 1)
            throw new EmptyProductStockError()
        
        let currentCart: Cart 
        let currentCartExist = true
        try{
            currentCart = await this.dao.getCart(user)
        }catch(err){
            if(err instanceof CartNotFoundError){
                currentCartExist = false
                currentCart = new Cart(user.username, false, null, 0, [])
            }else{
                throw err
            }
        }

        const products: ProductInCart[] = currentCart.products 
        
        const idx = products.findIndex((item: ProductInCart) => item.model === model)
        if(idx >= 0){
            const product = products[idx]
            product.quantity += 1
            product.price = newProduct.sellingPrice
            product.category = newProduct.category
        }else{
            products.push(new ProductInCart(model, 1, newProduct.category, newProduct.sellingPrice))
        }

        currentCart.total = 0
        products.forEach((item: ProductInCart) => {currentCart.total += item.price * item.quantity});


        if(currentCartExist){
            return this.dao.updateCurrentCart(user, currentCart)
        }else{
            return this.dao.createCurrentCart(user, currentCart)
        }
    }


    /**
     * Retrieves the current cart for a specific user.
     * @param user - The user for whom to retrieve the cart.
     * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
     */
    async getCart(user: User): Promise<Cart> { 
        //if(user.role !== Role.CUSTOMER)
        //    throw new UserNotCustomerError
        let currentCart
        try{
            currentCart = await this.dao.getCart(user)
        }catch(err){
            if(err instanceof CartNotFoundError){
                currentCart = new Cart(user.username, false, null, 0, [])
            }else{
                throw err
            }
        }
        return currentCart
    }

    /**
     * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
     * @param user - The user whose cart should be checked out.
     * @returns A Promise that resolves to `true` if the cart was successfully checked out.
     */
    async checkoutCart(user: User): Promise<Boolean> {
        //if(user.role !== Role.CUSTOMER)
            //throw new UserNotCustomerError
        const currentCart: Cart = await this.dao.getCart(user)
        const products = currentCart.products
        
        /*
        if(!currentCart.exist()){
            throw new CartNotFoundError()
        }
        */

        if(products.length === 0){
            throw new EmptyCartError()
        }

        for(const cartItem of products){
            const product = await this.productDao.getProductByModel(cartItem.model)
            if(product.quantity > 0){
                if(cartItem.quantity > product.quantity){
                    throw new LowProductStockError()
                }
            }else{
                throw new EmptyProductStockError()
            }
        }

        for(const cartItem of products){
            await this.productDao.sellModel(cartItem.model, cartItem.quantity, null)
        }
        return this.dao.checkoutCart(user)
    }

    /**
     * Retrieves all paid carts for a specific customer.
     * @param user - The customer for whom to retrieve the carts.
     * @returns A Promise that resolves to an array of carts belonging to the customer.
     * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
     */
    async getCustomerCarts(user: User): Promise<Cart[]> { 
        //if(user.role !== Role.CUSTOMER)
        //    throw new UserNotCustomerError
        return this.dao.getCustomerCarts(user)
    } 

    /**
     * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
     * @param user The user who owns the cart.
     * @param product The model of the product to remove.
     * @returns A Promise that resolves to `true` if the product was successfully removed.
     */
    async removeProductFromCart(user: User, model: string) /**Promise<Boolean> */ {
        //if(user.role !== Role.CUSTOMER)
            //throw new UserNotCustomerError
        const oldProduct = await this.productDao.getProductByModel(model)
        
        const currentCart: Cart = await this.dao.getCart(user)
        const products: ProductInCart[] = currentCart.products 

        /*
        if(!currentCart.exist())
            throw new CartNotFoundError()
        */
        
        const idx = products.findIndex((item: ProductInCart) => item.model === model)
        if(idx >= 0){
            const product = products[idx]
            if(product.quantity > 1){
                product.quantity -= 1 
            }
            else{
                products.splice(idx,1)
            }

            currentCart.total -= product.price
        }else{
            throw new ProductNotInCartError()
        }
        
        return this.dao.updateCurrentCart(user, currentCart)
     }


    /**
     * Removes all products from the current cart.
     * @param user - The user who owns the cart.
     * @returns A Promise that resolves to `true` if the cart was successfully cleared.
     */
    async clearCart(user: User)/*:Promise<Boolean> */ { 
        if(user.role !== Role.CUSTOMER)
            throw new UserNotCustomerError
        const currentCart = await this.dao.getCart(user)
        if (!currentCart) {
            throw new CartNotFoundError
        }
        return this.dao.clearCart(user)
    }

    /**
     * Deletes all carts of all users.
     * @returns A Promise that resolves to `true` if all carts were successfully deleted.
     */
    async deleteAllCarts() /**Promise<Boolean> */ { 
        return this.dao.deleteAllCarts()
    }

    /**
     * Retrieves all carts in the database.
     * @returns A Promise that resolves to an array of carts.
     */
    async getAllCarts() /*:Promise<Cart[]> */ {
        return this.dao.getAllCarts()
     }
}

export default CartController