import { test, expect, jest ,afterEach, beforeEach, describe } from "@jest/globals"
import dayjs  from "dayjs";
import { User, Role} from "../../src/components/user";
import { Product, Category } from "../../src/components/product";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../../src/errors/cartError"
import { Cart } from "../../src/components/cart";
import CartDAO from "../../src/dao/cartDAO";
import db from "../../src/db/db"
import { Database } from "sqlite3"


jest.mock("crypto")
jest.mock("../../src/db/db.ts")


afterEach(()=>{
    //jest.restoreAllMocks()
    jest.clearAllMocks()
})


describe("CartDAO unit testing", ()=>{

    const mockUser = new User("tusername","tname","tsurname", Role.CUSTOMER , "taddress", "10-10-1999");
    const mockproduct = new Product(50.0, "Samsung GalaxyA54", Category.SMARTPHONE, "", "", 50);
    const mockCart = new Cart("tcustomer", true, "11-06-2024", 10, [{model:"Samsung GalaxyA54", quantity: 10, category: Category.SMARTPHONE, price: 50.00 }]);








   describe('getCart', () => {
      beforeEach(() => {
          //jest.clearAllMocks();
      });

      
      test('should resolve with a Cart object when an unpaid cart is found', async () => {
          const mockRow = {
              customer: 'tusername',
              paid: false,
              paymentDate: "null",
              total: 10,
              products: '[{"model":"Samsung GalaxyA54","quantity":10,"category":"Smartphone","price":50}]'
          };

          jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
              if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 0") && params[0] === 'tusername') {
                return callback(null, mockRow)
              }
          });
          
          const cartDAO = new CartDAO()

          const result = await cartDAO.getCart(mockUser);
          expect(result).toEqual(
              new Cart('tusername', false, "null", 10, [{ model: 'Samsung GalaxyA54', quantity: 10, category: Category.SMARTPHONE, price: 50 }])
          );
          expect(db.get).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
          
      });
      
      
      test('should reject when no unpaid cart is found', async () => {
          jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
              if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 0") && params[0] === 'tusername') {
                  return callback(null, null);
              }
          });
          await expect(CartDAO.prototype.getCart(mockUser)).rejects.toEqual(new CartNotFoundError());
          
          jest.clearAllMocks();
      });
      
      test('should reject with an error if an error occurs during retrieving the cart', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
              if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 0") && params[0] === 'tusername') {
                  return callback(new Error(errorMessage));
              }
          });
          await expect(CartDAO.prototype.getCart(mockUser)).rejects.toThrow(errorMessage);
          expect(db.get).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });

    describe('checkoutCart', () => {
      beforeEach(() => {
          jest.clearAllMocks();
      });
      test('should resolve true when cart is checked out successfully', async () => {
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET paymentDate = ?, paid = 1 WHERE customer = ? AND paid = 0") &&
                  params[1] === 'tusername' &&
                  params[0] === dayjs().format("YYYY-MM-DD")) {
                  return callback(null);
              }
          });
          const result = await CartDAO.prototype.checkoutCart(mockUser);
          expect(result).toBe(true);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      test('should reject with an error if an error occurs during checkout', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET paymentDate = ?, paid = 1 WHERE customer = ? AND paid = 0") &&
                  params[1] === 'tusername') {
                  return callback(new Error(errorMessage));
              }
          });
          await expect(CartDAO.prototype.checkoutCart(mockUser)).rejects.toThrow(errorMessage);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });





    describe('getCustomerCarts', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        
        test('should resolve with an array of Cart objects when customer carts are retrieved successfully', async () => {
            const mockRows = [
                { customer: 'tusername', paid: true, paymentDate: '11-06-2024', total: 10, products: '[{"model":"Samsung GalaxyA54","quantity":10,"category":"Smartphone","price":50}]' },
                { customer: 'tusername', paid: true, paymentDate: '12-06-2024', total: 20, products: '[{"model":"iPhone 12","quantity":1,"category":"Smartphone","price":1000}]' }
            ];
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 1") && params[0] === 'tusername') {
                    return callback(null, mockRows);
                }
            });
            const result = await CartDAO.prototype.getCustomerCarts(mockUser);
            expect(result).toEqual([
                new Cart('tusername', true, '11-06-2024', 10, [{ model: 'Samsung GalaxyA54', quantity: 10, category: Category.SMARTPHONE, price: 50 }]),
                new Cart('tusername', true, '12-06-2024', 20, [{ model: 'iPhone 12', quantity: 1, category: Category.SMARTPHONE, price: 1000 }])
            ]);
            expect(db.all).toHaveBeenCalledTimes(1);
            jest.clearAllMocks();
        });
        
        test('should reject with an error if an error occurs during retrieving customer carts', async () => {
            const errorMessage = "Database error";
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 1") && params[0] === 'tusername') {
                    return callback(new Error(errorMessage));
                }
            });
            await expect(CartDAO.prototype.getCustomerCarts(mockUser)).rejects.toThrow(errorMessage);
            expect(db.all).toHaveBeenCalledTimes(1);
            jest.clearAllMocks();
        });
        test('should reject with CartNotFoundError if no customer carts are found', async () => {
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT * FROM cart WHERE customer = ? AND paid = 1") && params[0] === 'tusername') {
                    return callback(null, null);
                }
            });
            await expect(CartDAO.prototype.getCustomerCarts(mockUser)).rejects.toThrow(CartNotFoundError);
            expect(db.all).toHaveBeenCalledTimes(1);
            jest.clearAllMocks();
        });
    });






    describe('updateCurrentCart', () => {
      beforeEach(() => {
          jest.clearAllMocks();
      });
      test('should resolve true when cart is updated successfully', async () => {
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET paymentDate = ?, total = ?, products = ? WHERE customer = ? AND paid = 0")) {
                  return callback(null);
              }
          });
          const result = await CartDAO.prototype.updateCurrentCart(mockUser, mockCart);
          expect(result).toBe(true);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      test('should reject with an error if an error occurs during update', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET paymentDate = ?, total = ?, products = ? WHERE customer = ? AND paid = 0")) {
                  return callback(new Error(errorMessage));
              }
          });

          await expect(CartDAO.prototype.updateCurrentCart(mockUser, mockCart)).rejects.toThrow(errorMessage);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });




    describe('createCurrentCart', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        test('should resolve true when cart is created successfully', async () => {
          jest.spyOn(db,"run").mockImplementation((sql,params,callback)=>{
            if(sql.includes("INSERT INTO cart(customer, paid, paymentDate, total, products) VALUES(?,0,NULL,?,?)")){
              return callback(null)
            }
          })
          const result = await CartDAO.prototype.createCurrentCart(mockUser,mockCart)
          expect(result).toBe(true)
          expect(db.run).toHaveBeenCalledTimes(1)
          jest.clearAllMocks()
        });
    });






    describe('clearCart', () => {
      beforeEach(() => {
          jest.clearAllMocks();
      });
      test('should resolve true when cart is cleared successfully', async () => {
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET products = ? WHERE customer = ? AND paid = 0")) {
                  return callback(null);
              }
          });

          const result = await CartDAO.prototype.clearCart(mockUser);
          expect(result).toBe(true);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      test('should reject with an error if an error occurs during clearing cart', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
              if (sql.includes("UPDATE cart SET products = ? WHERE customer = ? AND paid = 0")) {
                  return callback(new Error(errorMessage));
              }
          });
          await expect(CartDAO.prototype.clearCart(mockUser)).rejects.toThrow(errorMessage);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });





    describe('deleteAllCarts', () => {
      beforeEach(() => {
          jest.clearAllMocks();
      });
      test('should resolve true when all carts are deleted successfully', async () => {
          jest.spyOn(db, "run").mockImplementation((sql, callback) => {
              if (sql.includes("DELETE FROM cart")) {
                  return callback(null);
              }
          });
          const result = await CartDAO.prototype.deleteAllCarts();
          expect(result).toBe(true);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      test('should reject with an error if an error occurs during deleting carts', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "run").mockImplementation((sql, callback) => {
              if (sql.includes("DELETE FROM cart")) {
                  return callback(new Error(errorMessage));
              }
          });
          await expect(CartDAO.prototype.deleteAllCarts()).rejects.toThrow(errorMessage);
          expect(db.run).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });



    describe('getAllCarts', () => {
      beforeEach(() => {
          jest.clearAllMocks();
      });

      test('should resolve with an array of Cart objects when carts are retrieved successfully', async () => {
          const mockRows = [
              { customer: 'tcustomer1', paid: true, paymentDate: '11-06-2024', total: 10, products: '[{"model":"Samsung GalaxyA54","quantity":10,"category":"Smartphone","price":50}]' },
              { customer: 'tcustomer2', paid: false, paymentDate: '14-06-2024', total: 20, products: '[]' }
          ];
          jest.spyOn(db, "all").mockImplementation((sql, callback) => {
              if (sql.includes("SELECT * FROM cart")) {
                  return callback(null, mockRows);
              }
          });
          const result = await CartDAO.prototype.getAllCarts();
          expect(result).toEqual([
              new Cart('tcustomer1', true, '11-06-2024', 10, [{ model: 'Samsung GalaxyA54', quantity: 10, category: Category.SMARTPHONE, price: 50 }]),
              new Cart('tcustomer2', false,'14-06-2024', 20, [])
          ]);
          expect(db.all).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      
      test('should reject with an error if an error occurs during retrieving carts', async () => {
          const errorMessage = "Database error";
          jest.spyOn(db, "all").mockImplementation((sql, callback) => {
              if (sql.includes("SELECT * FROM cart")) {
                  return callback(new Error(errorMessage));
              }
          });
          await expect(CartDAO.prototype.getAllCarts()).rejects.toThrow(errorMessage);
          expect(db.all).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
      test('should reject with CartNotFoundError if no carts are found', async () => {
          jest.spyOn(db, "all").mockImplementation((sql, callback) => {
              if (sql.includes("SELECT * FROM cart")) {
                  return callback(null, null);
              }
          });
          await expect(CartDAO.prototype.getAllCarts()).rejects.toThrow(CartNotFoundError);
          expect(db.all).toHaveBeenCalledTimes(1);
          jest.clearAllMocks();
      });
    });




})