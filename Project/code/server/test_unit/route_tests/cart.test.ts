import { test, expect, jest ,afterEach, it, beforeAll, beforeEach, describe } from "@jest/globals"
import request from "supertest"
import CartController from "../../src/controllers/cartController"
import {app} from "../.."
import { Role, User } from "../../src/components/user"
import { Product, Category } from "../../src/components/product";
import { Cart, ProductInCart } from "../../src/components/cart";
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../../src/errors/cartError"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper";


const baseURL = "/ezelectronics/carts"
jest.mock("../../src/routers/auth")
jest.mock("../../src/controllers/productController")

describe("cart routing test",()=>{
    const mockUser = new User("tusername","tname","tsurname", Role.CUSTOMER , "taddress", "10-10-1999");
    const mockProduct = new Product(50.0, "Samsung GalaxyA54", Category.SMARTPHONE, "", "", 50);
    const mockCart = {
        customer: "tcustomer",
        paid: true,
        paymentDate: "11-06-2024",
        products: [
            {
                model: "Samsung GalaxyA54",
                quantity: 10,
                category: Category.SMARTPHONE,
                price: 50.00,
            }
        ],
        total: 10
    };
    const mockCarts = [
        {
            customer: "tcustomer1",
            paid: true,
            paymentDate: "11-06-2024",
            products: [
                {
                    model: "Samsung GalaxyA54",
                    quantity: 10,
                    category: Category.SMARTPHONE,
                    price: 50.00,
                }
            ],
            total: 10
        },
        {
            customer: "tcustomer2",
            paid: false,
            paymentDate: "12-06-2024",
            products: [
                {
                    model: "iPhone 13",
                    quantity: 5,
                    category: Category.SMARTPHONE,
                    price: 1000.00,
                }
            ],
            total: 5
        }
    ];


    describe("GET /carts",()=>{
        test("It should return a 200 success code",async ()=>{
            jest.spyOn(Authenticator.prototype,"isLoggedIn").mockImplementation((req,res,next)=>next())
            jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next())
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(mockCart as Cart)
            const response = await request(app).get(baseURL + "/").set("user", JSON.stringify(mockUser))
            expect(response.status).toBe(200)
            expect(response.body).toEqual(mockCart)
            expect(CartController.prototype.getCart).toHaveBeenCalledTimes(1)
            expect(CartController.prototype.getCart).toHaveBeenCalledWith(undefined)
            jest.resetAllMocks()
        })
    })




     describe("POST /carts", () => {
         test("should add a product to the cart", async () => {
             jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {req.user = mockUser; next()});

             jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => next());
             jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);

             const response = await request(app)
                 .post(baseURL + "/")
                 //.set("user", "hi")//JSON.stringify(mockUser))
                 .send({model : mockProduct.model});

             expect(response.status).toBe(200);
             expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
             expect(CartController.prototype.addToCart).toHaveBeenCalledWith(mockUser, mockProduct.model);
             jest.resetAllMocks();
         });

         
         test("should return 409 error code if product is already in the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {next()});
             jest.spyOn(CartController.prototype, "addToCart").mockRejectedValue(new ProductInCartError());
             const response = await request(app)
                 .post(baseURL + "/")
                 //.set("user", JSON.stringify(mockUser))
                 .send({model : mockProduct.model});
             expect(response.status).toBe(409);
             expect(CartController.prototype.addToCart).toHaveBeenCalledTimes(1);
             jest.resetAllMocks();
         });
     });




    describe("PATCH /carts", () => {
        test("should checkout the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);

            const response = await request(app)
                .patch(baseURL + "/")
                .set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
        test("should checkout the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new EmptyCartError());

            const response = await request(app)
                .patch(baseURL + "/")
                .set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(400);
            expect(response.body.error).toEqual("Cart is empty");
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
        test("should checkout the cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValue(new ProductNotInCartError());

            const response = await request(app)
                .patch(baseURL + "/")
                .set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Product not in cart");
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
    });





    describe("GET /carts/history", () => {
        test("should get the customer's cart history", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce(mockCarts as Cart[]);
            const response = await request(app)
                .get(baseURL + "/history")
                .set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockCarts);
            expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
    });




     describe("DELETE /carts/products/:model", () => {
         test("should remove a product from the cart", async () => {
             //jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());

             jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {req.user = mockUser; next()});
             jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
             const response = await request(app)
                 .delete(`${baseURL}/products/${mockProduct.model}`)
                 //.set("user", JSON.stringify(mockUser));
             expect(response.status).toBe(200);
             expect(response.body).toEqual({});
             expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledTimes(1);
             expect(CartController.prototype.removeProductFromCart).toHaveBeenCalledWith(mockUser, mockProduct.model);

             jest.resetAllMocks();
         });
     });





    describe("DELETE /carts/current", () => {
        test("should clear the current cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + "/current").set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.clearCart).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
        test("should clear the current cart", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValue(new CartNotFoundError());
            const response = await request(app).delete(baseURL + "/current").set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(404);
            expect(response.body.error).toEqual("Cart not found");
            expect(CartController.prototype.clearCart).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.clearCart).toHaveBeenCalledWith(undefined);

            jest.resetAllMocks();
        });
    });





    describe("DELETE /carts", () => {
        test("should delete all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);

            const response = await request(app).delete(baseURL + "/").set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toHaveBeenCalledWith();

            jest.resetAllMocks();
        });
    });




    describe("GET /carts/all", () => {
        test("should get all carts", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => next());
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => next());
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce(mockCarts as Cart[]);

            const response = await request(app).get(baseURL + "/all").set("user", JSON.stringify(mockUser));
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockCarts);
            expect(CartController.prototype.getAllCarts).toHaveBeenCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toHaveBeenCalledWith();
            
            jest.resetAllMocks();
        });
    });






})