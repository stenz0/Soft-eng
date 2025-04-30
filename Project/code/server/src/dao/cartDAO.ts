import db from "../db/db"
import {Cart} from "../components/cart";
import {User} from "../components/user";
import {CartNotFoundError, EmptyCartError, ProductNotInCartError} from "../errors/cartError";
import { Product } from "../components/product";
import { ProductInCart } from "../components/cart";
import dayjs from 'dayjs';
import { stringify } from "querystring";

/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

initCartDB(): Promise<Boolean> {
    return new Promise<Boolean>((resolve, reject) => {
        const createTableSql = 
                `CREATE TABLE IF NOT EXISTS cart (
                cartID INTEGER AUTO_INCREMENT,
                customer TEXT,
                paid INTEGER,
                paymentDate TEXT,
                total FLOAT,
                products TEXT,
                PRIMARY KEY(cartID))`;
    
            // Runs the create table query
            db.run(createTableSql, [], (err: Error | null) => {
                if(err)
                    reject(err)
                resolve(true)
            })
    })
}

deleteTable(): Promise<Boolean> {
    return new Promise<Boolean>((resolve, reject) => {
        const sql = "DROP TABLE cart"
            db.run(sql, [], (err: Error | null) => {
                if(err)
                    reject(err)
                resolve(true)
            })
    })
}

/**
 * Retrieves the current cart for a specific user.
 * @param user - The user for whom to retrieve the cart.
 * @returns A Promise that resolves to the user's cart or an empty one if there is no current cart.
 */
getCart(user: User) : Promise<Cart> {
    return new Promise<Cart>((resolve, reject) => {
        try {
            const username = user.username;
            const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 0"
            db.get(sql, [username], (err: Error | null, row: any) => {
                if (err){
                    reject(err);   
                }

                if(row){
                    const cart: Cart = new Cart(row.customer, row.paid, row.paymentDate, row.total, JSON.parse(row.products));
                    resolve(cart)
                }else{
                    reject(new CartNotFoundError())
                }       
            })
        } catch (error) {
            reject(error);
        }
    })
}   



/**
 * Checks out the user's cart. We assume that payment is always successful, there is no need to implement anything related to payment.
 * @param user - The user whose cart should be checked out.
 * @returns A Promise that resolves to `true` if the cart was successfully checked out.
 */
checkoutCart(user: User):Promise<Boolean>{
    return new Promise<Boolean>((resolve, reject)=>{
        try{
            const username = user.username;
            const sql = "UPDATE cart SET paymentDate = ?, paid = 1 WHERE customer = ? AND paid = 0"
            db.run(sql, [dayjs().format("YYYY-MM-DD"), username], (err:Error | null, row: any) => {
                if(err) reject(err)
                else resolve(true)
            })
              
        }  catch(error) {
            reject(error)
        }
    })
 }




/**
 * Retrieves all paid carts for a specific customer.
 * @param user - The customer for whom to retrieve the carts.
 * @returns A Promise that resolves to an array of carts belonging to the customer.
 * Only the carts that have been checked out should be returned, the current cart should not be included in the result.
 */
getCustomerCarts(user: User):Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject)=>{
        try{
            const username = user.username;
            const sql = "SELECT * FROM cart WHERE customer = ? AND paid = 1"
            db.all(sql, [username], (err:Error | null, rows: any) => {
                if(err) {
                    reject(err);
                    return
                }
                if (!rows) {
                    reject(new CartNotFoundError());
                }
                const carts: Cart[] = rows.map((row:any) => new Cart(row.customer, row.paid, row.paymentDate, row.total, JSON.parse(row.products)));
                resolve(carts);
            })
            
        } catch(error) {
            reject(error)
        }
    })
} 


updateCurrentCart(user: User, cart: Cart): Promise<Boolean>{
    return new Promise<Boolean>((resolve, reject)=>{
        try{
            const updateCart = "UPDATE cart SET paymentDate = ?, total = ?, products = ? WHERE customer = ? AND paid = 0"
            db.run(updateCart, [cart.paymentDate, cart.total, JSON.stringify(cart.products), user.username], (err: Error | null) => {
                if(err) reject(err)
                else resolve(true)
            })
        }
        catch(err){
            reject(err)
        }
    })
}


createCurrentCart(user: User, cart: Cart): Promise<Boolean>{
    return new Promise<Boolean>((resolve, reject)=>{
        try{
            const createCartSql = "INSERT INTO cart(customer, paid, paymentDate, total, products) VALUES(?,0,NULL,?,?)"
                db.run(createCartSql,[user.username, cart.total, JSON.stringify(cart.products)],(err: Error | null, row: any) => {
                    if(err) reject(err)
                    else resolve(true)
                })
        }
        catch(err){
            reject(err)
        }
    })
}

/**
 * Removes one product unit from the current cart. In case there is more than one unit in the cart, only one should be removed.
 * @param user The user who owns the cart.
 * @param product The model of the product to remove.
 * @returns A Promise that resolves to `true` if the product was successfully removed.
 */

// It requires the model of the product to remove. the product must exist in the current cart





/**
 * Removes all products from the current cart.
 * @param user - The user who owns the cart.
 * @returns A Promise that resolves to `true` if the cart was successfully cleared.
 */
clearCart(user: User):Promise<Boolean> { 
    return new Promise<Boolean>((resolve, reject)=>{
        try{
            const username = user.username;
            const sql = "DELETE FROM cart WHERE customer = ? AND paid = 0";
            db.run(sql, [username], (err:Error | null) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(true)
                }
            }) 
            
        } catch(error) {
            reject(error)
        }
    })
}






/**
 * Deletes all carts of all users.
 * @returns A Promise that resolves to `true` if all carts were successfully deleted.
 */
deleteAllCarts():Promise<Boolean> { 
    return new Promise<Boolean>((resolve, reject)=>{
        try{
            const sql = "DELETE FROM cart";
            db.run(sql, (err:Error | null) => {
                if(err) {
                    reject(err);
                }
                resolve(true);
            })   
        } catch(error) {
            reject(error)
        }
    })
}




/**
 * Retrieves all carts in the database.
 * @returns A Promise that resolves to an array of carts.
 */
getAllCarts():Promise<Cart[]> {
    return new Promise<Cart[]>((resolve, reject)=>{
        try{
            const sql = "SELECT * FROM cart"
            db.all(sql, (err:Error | null, rows: any) => {
                if(err) {
                    reject(err);
                    return
                }if(!rows) {
                    reject (new CartNotFoundError)
                    return
                } else {
                    const carts: Cart[] = rows.map((row:any) => new Cart(row.customer, row.paid, row.paymentDate, row.total, JSON.parse(row.products)));
                    resolve(carts)
                }
            })           
        } catch(error) {
            reject(error)
        }
    })
 }




}



export default CartDAO