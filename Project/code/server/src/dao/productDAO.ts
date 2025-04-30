import db from "../db/db";
import { Category, Product } from "../components/product";
import dayjs from 'dayjs';
import { ProductAlreadyExistsError, ProductNotFoundError, LowProductStockError, EmptyProductStockError, GroupingError } from "../errors/productError";
import { DateError } from "../utilities";

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /** 
     * It creates a new model in the products table. If the products table doesn't exist, it will create it and put the new model in. 
     * It doesn't return anything
     */
    newModel(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        return new Promise((resolve, reject) => {
            // Verify the date
            if (arrivalDate === null || arrivalDate === undefined || arrivalDate === '') arrivalDate = dayjs().format("YYYY-MM-DD");
            else if (dayjs(arrivalDate).isAfter(dayjs())) return reject(new DateError());
            
            // Create table if it doesn't exist
            const createTableSql = 
                `CREATE TABLE IF NOT EXISTS products (
                model TEXT PRIMARY KEY,
                category TEXT,
                quantity INTEGER,
                details TEXT,
                sellingPrice REAL,
                arrivalDate TEXT)`;
    
            // Runs the create table query
            db.run(createTableSql, [], (err: Error | null) => {
                if (err) return reject(err);
    
                // Runs the insert query after table creation
                const insertSql = "INSERT INTO products (model, category, quantity, details, sellingPrice, arrivalDate) VALUES (?, ?, ?, ?, ?, ?)";
                db.run(insertSql, [model, category, quantity, details, sellingPrice, arrivalDate], (err: Error | null) => {
                    if (err) return reject(new ProductAlreadyExistsError());
                    return resolve();
                });
            });
        });
    }
    

    /** 
     * It updates a model's quantity and/or arrival date.
     * The number to use as quantity is not the new quantity but the increment to add to the old one.
     * It return the new quantity available
     */
    updateModel(model: string, quantity: number, arrivalDate: string | null): Promise<number> {
        return new Promise((resolve, reject) => {

            // Checks the date
            if (arrivalDate === null || arrivalDate === undefined || arrivalDate === '')
                arrivalDate = dayjs().format("YYYY-MM-DD");

            else if (dayjs(arrivalDate, "YYYY-MM-DD").isAfter(dayjs())){
                //console.log("is after")
                return reject(new DateError())
                
            }

            const sql = "SELECT quantity,arrivalDate FROM products WHERE model = ?";
            db.get(sql, [model], (err: Error | null, row : any) => {
                if (err) return reject(err);
                else if (row === null || row === undefined || row === '') return reject(new ProductNotFoundError());
                if (dayjs(arrivalDate).isBefore(dayjs(row.arrivalDate))) return reject(new DateError());
                    arrivalDate = dayjs(arrivalDate).format("YYYY-MM-DD");
                const updateSql = "UPDATE products SET quantity = ? WHERE model = ?";
                db.run(updateSql, [quantity + row.quantity, model], (err: Error | null) =>  {
                    if (err) return reject(err);
                    return resolve(quantity + row.quantity)
                });
            });
        });
    }

    /** 
     * It allows selling products. Model is the name of the model sold, quantity is the number of products sold, selling date is
     * the date when it happened. If the selling date is null, the date used is the one of today.
     * It returns the number of products remaining.
     */
    sellModel(model: string, quantity: number, sellingDate: string | null): Promise<number> {
        return new Promise((resolve, reject) => {
            // Check the date
            if (sellingDate === null || sellingDate === undefined || sellingDate === '') {
                sellingDate = dayjs().format("YYYY-MM-DD");
            } else if (dayjs(sellingDate, "YYYY-MM-DD").isAfter(dayjs())) {
                return reject(new DateError());
            }
    
            const sql = "SELECT arrivalDate, quantity FROM products WHERE model = ?";
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    return reject(err);
                } else if (!row) {
                    return reject(new ProductNotFoundError());
                } else if (dayjs(sellingDate, "YYYY-MM-DD").isBefore(dayjs(row.arrivalDate, "YYYY-MM-DD"))) {
                    return reject(new DateError());
                } else if (row.quantity === 0) {
                    return reject(new EmptyProductStockError());
                } else if (row.quantity < quantity) {
                    return reject(new LowProductStockError());
                } else {
                    const updateSql = "UPDATE products SET quantity = quantity - ? WHERE model = ?";
                    db.run(updateSql, [quantity, model], (err: Error | null) => {
                        if (err) {
                            return reject(err);
                        } else {
                            return resolve(row.quantity - quantity);
                        }
                    });
                }
            });
        });
    }
    

    /** 
     * It gets all the products. They can be filtered by category (one between "Smartphone", "Laptop", "Appliance") or by model. If so,
     * "grouping" should be equal to the word "category" or "model"
     */
    async getAllProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            let flag = false;
            if (category === undefined || category === '') category = null;
            if (model === undefined || model === '') model = null;
            
            let sql = "SELECT * FROM products";
            let params: any[] = [];
            
            if (grouping === "category") {
                if (category === null || model !== null) {
                    return reject(new GroupingError());
                }
                sql += " WHERE category = ?";
                params.push(category);
            } else if (grouping === "model") {
                if (model === null || category !== null) {
                    return reject(new GroupingError());
                }
                sql += " WHERE model = ?";
                params.push(model);
                flag = true;
            } else {
                if (model !== null || category !== null) {
                    return reject(new GroupingError());
                }
            }
            
            db.all(sql, params, (err: Error | null, rows: any[]) => {
                if (err) {
                    return reject(err);
                }
                if (rows.length === 0) {
                    if (flag) return reject(new ProductNotFoundError());
                }
                const products: Product[] = rows.map((row: any) => {
                    return new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity);
                });
                return resolve(products);
            });
        });
    }

    /**
     * Delete all the rows of the table: product, product_history
     */
    deleteAllProducts(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sqlDeleteProducts = "DELETE FROM products";
            db.run(sqlDeleteProducts, [], (err: Error | null) => {
                if (err) return reject(err);
                return resolve(true);
            });
        });
    }

    /** 
     * It deletes a specific product from the products table based on the model.
     * It also deletes the corresponding entries from the products_history table.
     * It returns true if the operation is successful.
     */
    deleteOneProduct(model: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const sql = "DELETE FROM products WHERE model = ?";
            db.run(sql, [model], (err : Error | null) => {
                if(err) reject(err);
                return resolve(true);
            });
        });
    }

    getProductByModel(model: string): Promise<Product>{
        return new Promise<Product>((resolve, reject) => {
            const sql = "SELECT * FROM products WHERE model = ?"
            db.get(sql, [model], (err: Error | null, row: any) => {
                if (err) {
                    reject(err)
                    return
                }
                if (!row) {
                    reject(new ProductNotFoundError())
                    return
                }
                const product: Product = new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                return resolve(product)
            })
        });
    }
}

export default ProductDAO;

