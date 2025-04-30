import { test, expect, jest, afterEach, describe } from "@jest/globals";
import CartController from "../../src/controllers/cartController";
import CartDAO from "../../src/dao/cartDAO";
import ProductDAO from "../../src/dao/productDAO";
import { Cart, ProductInCart } from "../../src/components/cart";
import { Product, Category } from "../../src/components/product";
import { ProductNotFoundError, LowProductStockError, EmptyProductStockError } from "../../src/errors/productError";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../../src/errors/cartError"
import { User, Role } from "../../src/components/user";

jest.mock("../../src/dao/cartDAO");
jest.mock("../../src/dao/productDAO");

afterEach(() => {
  jest.resetAllMocks();
  jest.clearAllMocks();
});

describe("CartController unit testing", () => {


  const testUser = new User("tusername","tname","tsurname", Role.CUSTOMER , "taddress", "10-10-1999");
  const testProduct = new Product(50.0, "Samsung GalaxyA54", Category.SMARTPHONE, "", "", 50);
  const testCart = new Cart("tcustomer", true, "11-06-2024", 10, [{model:"Samsung GalaxyA54", quantity: 10, category: Category.SMARTPHONE, price: 50.00 }]);
  const updatedCart = new Cart("ucustomer", true, "12-06-2024", 5, [{ model: "iPhone 13", quantity: 5, category: Category.SMARTPHONE, price: 80.00 }]);
  const emptyCart = new Cart("tcustomer", true, "11-06-2024", 0, []);
  const tCarts = [
    new Cart("customer1", true, "11-06-2024", 100, [
      { model: "Samsung GalaxyA54", quantity: 2, category: Category.SMARTPHONE, price: 50.00 }
    ]),
    new Cart("customer2", true, "12-06-2024", 200, [
      { model: "iPhone 13", quantity: 1, category: Category.SMARTPHONE, price: 200.00 }
    ])
  ];







    describe("getCart test cases", () => {
        test("It should return the cart for the logged in user", async () => {
        jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
        const controller = new CartController();
        const response = await controller.getCart(testUser);

        expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
        expect(response).toEqual(testCart);
        });






    describe("checkoutCart test cases", () => {
        test("It should successfully checkout the cart for the logged in user", async () => {
            jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel")
                .mockResolvedValueOnce(testProduct);
            jest.spyOn(ProductDAO.prototype, "sellModel").mockResolvedValueOnce(1);
            jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValueOnce(true);

            const controller = new CartController();
            const response = await controller.checkoutCart(testUser);

            expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
            expect(ProductDAO.prototype.sellModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.sellModel).toHaveBeenCalledWith("Samsung GalaxyA54", 10, null);
            expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.checkoutCart).toHaveBeenCalledWith(testUser);
            expect(response).toEqual(true);
        });

        test("It should throw LowProductStockError if a product has insufficient stock", async () => {
            const lowStockProduct = new Product(50.0, "Samsung GalaxyA54", Category.SMARTPHONE, "", "", 5);

            jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(lowStockProduct);

            const controller = new CartController();

            await expect(controller.checkoutCart(testUser)).rejects.toThrow(LowProductStockError);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
        });

        test("It should throw EmptyProductStockError if a product is out of stock", async () => {
            const outOfStockProduct = new Product(50.0, "Samsung GalaxyA54", Category.SMARTPHONE, "", "", 0);

            jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(outOfStockProduct);

            const controller = new CartController();

            await expect(controller.checkoutCart(testUser)).rejects.toThrow(EmptyProductStockError);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
        });

    })





    describe("getCustomerCarts test", () => {
      test("It should return the carts for the logged in user", async () => {
        jest.spyOn(CartDAO.prototype, "getCustomerCarts").mockResolvedValueOnce([testCart]);

        const controller = new CartController();
        const response = await controller.getCustomerCarts(testUser);

        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
        expect(CartDAO.prototype.getCustomerCarts).toHaveBeenCalledWith(testUser);
        expect(response).toEqual([testCart]);
    });
    })


   


    describe("addtoCart test" , () => {
        test("It should successfully remove a product from the cart", async () => {
            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
            jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
            jest.spyOn(CartDAO.prototype, "updateCurrentCart").mockResolvedValueOnce(true);

            const controller = new CartController();
            const response = await controller.removeProductFromCart(testUser, "Samsung GalaxyA54");

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
            expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(CartDAO.prototype.updateCurrentCart).toHaveBeenCalledTimes(1);
            // expect(CartDAO.prototype.updateCurrentCart).toHaveBeenCalledWith(testUser, updatedCart);
            expect(response).toEqual(true);
        });
        test("It should remove the product completely if the quantity is 1", async () => {
            const cartWithOneProduct = new Cart("tcustomer", true, "11-06-2024", 50, [{ model: "Samsung GalaxyA54", quantity: 1, category: Category.SMARTPHONE, price: 50.00 }]);

            jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
            jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(cartWithOneProduct);
            jest.spyOn(CartDAO.prototype, "updateCurrentCart").mockResolvedValueOnce(true);

            const controller = new CartController();
            const response = await controller.removeProductFromCart(testUser, "Samsung GalaxyA54");

            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
            expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
            expect(CartDAO.prototype.updateCurrentCart).toHaveBeenCalledTimes(1);
            expect(response).toEqual(true);
        });
    })





    describe("removeProductFromCart test cases", () => {      
        test("It should remove one quantity of the product from the cart", async () => {
          jest.spyOn(ProductDAO.prototype, "getProductByModel").mockResolvedValueOnce(testProduct);
          jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
          jest.spyOn(CartDAO.prototype, "updateCurrentCart").mockImplementationOnce((user, cart) => {
            
            expect(user).toEqual(testUser);
            return Promise.resolve(true);
          });
      
          const controller = new CartController();
          const response = await controller.removeProductFromCart(testUser, "Samsung GalaxyA54");
      
          
          expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledTimes(1);
          expect(ProductDAO.prototype.getProductByModel).toHaveBeenCalledWith("Samsung GalaxyA54");
          expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
          expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
          expect(CartDAO.prototype.updateCurrentCart).toHaveBeenCalledTimes(1);
          expect(response).toBe(true);
        });
      });



    describe("clearCart test", () => {
      test("It should clear the cart for the logged-in customer", async () => {
          jest.spyOn(CartDAO.prototype, "getCart").mockResolvedValueOnce(testCart);
          jest.spyOn(CartDAO.prototype, "clearCart").mockResolvedValueOnce(true);
          const controller = new CartController();
          const response = await controller.clearCart(testUser);
          expect(CartDAO.prototype.getCart).toHaveBeenCalledTimes(1);
          expect(CartDAO.prototype.getCart).toHaveBeenCalledWith(testUser);
          expect(testCart.products).toEqual([]);
          expect(testCart.total).toBe(0);
          expect(CartDAO.prototype.clearCart).toHaveBeenCalledTimes(1);
          expect(CartDAO.prototype.clearCart).toHaveBeenCalledWith(testUser);
          expect(response).toBe(true);
      });
  });







      describe("deleteAllCarts test cases", () => {
        test("It should delete all carts", async () => {
          jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
          const controller = new CartController();
          const response = await controller.deleteAllCarts();
    
          expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
          expect(response).toBe(true);
        });
    
        test("It should handle errors when trying to delete all carts", async () => {
          jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error("Database error"));
          const controller = new CartController();
    
          await expect(controller.deleteAllCarts()).rejects.toThrow("Database error");
          expect(CartDAO.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
        });
      });








      describe("getAllCarts test cases", () => {
        test("It should return all carts", async () => {
          jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValueOnce(tCarts);
          const controller = new CartController();
          const response = await controller.getAllCarts();
    
          expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
          expect(response).toEqual(tCarts);
        });
    
        test("It should handle errors when trying to get all carts", async () => {
          jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValueOnce(new Error("Database error"));
          const controller = new CartController();
    
          await expect(controller.getAllCarts()).rejects.toThrow("Database error");
          expect(CartDAO.prototype.getAllCarts).toHaveBeenCalledTimes(1);
        });
      });







  });
});
