import { test, expect, jest, beforeEach} from "@jest/globals"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { User, Role } from "../../src/components/user";
import { ProductReview } from "../../src/components/review";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import { ProductNotFoundError } from "../../src/errors/productError";


jest.mock("../../src/db/db");

beforeEach(() => {
    jest.clearAllMocks();
});
const testUser = new User("testcust", "testname", "testsurname", Role.CUSTOMER, "testaddress", "testbirthdate")
const testReview = {
    model: "Alexa",
    user: testUser,
    date: "testdate",
    score: 3,
    comment: "testcomment"
}
let reviewdao: ReviewDAO;
describe("ReviewDAO unit testing", ()=>{
    describe("addReview test cases",()=>{
        test("It should add a new review", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            if (sql.includes("SELECT model FROM products")) {
                return callback(null, { model: testReview.model });
            }
                return callback(null, null);
            });
            const Run = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                return callback(null);
            });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).resolves.toBeUndefined();
            expect(Run).toHaveBeenCalledTimes(1);
        });
        test("It should handle product not found error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(null, null);
              });
            
              await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError);
        });
        test("It should handle product not found error when the product does not exist", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, null);
                }
            });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ProductNotFoundError);
        });
        test("It should handle existing review error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                  return callback(null, { model: testReview.model});
                }
                if (sql.includes("SELECT * FROM reviews")) {
                  return callback(null, { model: testReview.model, user: testReview.user.username});
                }
                return callback(null, null);
            });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(ExistingReviewError);
        });
        test("It should handle database error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"), null);
              });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(Error);
        });
        test("It should handle database error when product exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, { model: testReview.model });
                } else if (sql.includes("SELECT * FROM reviews WHERE model = ? and user = ?")) {
                    return callback(null, null);
                }
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(Error);
        });
        test("It should handle database error when review exists", async () => {
            reviewdao = new ReviewDAO();
            //jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            //    return callback(null, {model: testReview.model, user: testReview.user.username});
            //});
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, { model: testReview.model });
                } else if (sql.includes("SELECT * FROM reviews WHERE model = ? and user = ?")) {
                    return callback(null, {model: testReview.model, user: testReview.user.username});
                }
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)).rejects.toThrow(Error);
        });
    });
    describe("GetProductReviews test cases",()=>{
        test("It should get product reviews", async () => {
            reviewdao = new ReviewDAO();
            const mockAll = jest.spyOn(db, "all").mockImplementationOnce((sql, values, callback) => {
                return callback(null, [new ProductReview(testReview.model,testReview.user.username,testReview.score,testReview.date,testReview.comment)]);
            });
            const result = await reviewdao.getProductReviews(testReview.model);
            expect(result).toEqual([new ProductReview(testReview.model,testReview.user.username,testReview.score,testReview.date,testReview.comment)]);
            expect(mockAll).toHaveBeenCalledTimes(1);
        });
        test("It should return empty array if there is no review", async () => {
            reviewdao = new ReviewDAO();
            const mockAll = jest.spyOn(db, "all").mockImplementationOnce((sql, values, callback) => {
                return callback(null, []);
            });
            const result = await reviewdao.getProductReviews(testReview.model);
            expect(result).toEqual([]);
            expect(mockAll).toHaveBeenCalledTimes(1);
        });
        test("It should handle database error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"), null);
            });
            await expect(reviewdao.getProductReviews(testReview.model)).rejects.toThrow(Error);
        });
        test("It should handle database error when product exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                return callback(null, { model: testReview.model });
            });
            //jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
            //    if (sql.includes("SELECT model FROM products")) {
            //        return callback(null, { model: testReview.model });
            //    } else if (sql.includes("SELECT * FROM reviews WHERE model = ? and user = ?")) {
            //        return callback(null, null);
            //    }
            //});
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.getProductReviews(testReview.model)).rejects.toThrow(Error);
        });
        test("It should handle database error when review exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                return callback(null, {model: testReview.model, user: testReview.user.username});
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.getProductReviews(testReview.model)).rejects.toThrow(Error);
        });
    });
    describe("deleteReview test cases",()=>{
        test("It should delete a user's review of a product", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(null, { model: testReview.model, user: testReview.user.username });
            });
            const Run = jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                return callback(null);
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).resolves.toBeUndefined();
            expect(Run).toHaveBeenCalledTimes(1);
        });
        test("It should handle product not found error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(null, null);
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).rejects.toThrow(ProductNotFoundError);
        });
        test("It should handle product not found error when the product does not exist", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, null);
                }
            }); 
            await expect(reviewdao.deleteReview("notexisting", testReview.user)).rejects.toThrow(ProductNotFoundError);
        });
        test("It should handle no ReviewProduct error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                //console.log(sql)
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, {model: testReview.model});
                }
                return callback(null, null);
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).rejects.toThrow(NoReviewProductError);
        });
        test("It should handle database error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"), null);
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).rejects.toThrow(Error);
        });
        test("It should handle database error when product exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, { model: testReview.model });
                } else if (sql.includes("SELECT * FROM reviews WHERE model = ? and user = ?")) {
                    return callback(null, null);
                }
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).rejects.toThrow(Error);
        });
        test("It should handle database error when review exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                return callback(null, {model: testReview.model, user: testReview.user.username});
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.deleteReview(testReview.model, testReview.user)).rejects.toThrow(Error);
        });
    });
    describe("deleteReviewsOfProduct test cases",()=>{    
        test("It should delete all reviews of a product", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(null, { model: testReview.model });
            });
            const Run = jest.spyOn(db, "run").mockImplementationOnce((sql, values, callback) => {
                return callback(null);
            });
            await expect(reviewdao.deleteReviewsOfProduct(testReview.model)).resolves.toBeUndefined();
            expect(Run).toHaveBeenCalledTimes(1);
        });
        test("It should handle product not found error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(null, null);
            });
            await expect(reviewdao.deleteReviewsOfProduct(testReview.model)).rejects.toThrow(ProductNotFoundError);
        });
        test("It should handle database error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"), null);
            });
            await expect(reviewdao.deleteReviewsOfProduct(testReview.model)).rejects.toThrow(Error);
        });
        test("It should handle database error when product exists", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                if (sql.includes("SELECT model FROM products")) {
                    return callback(null, { model: testReview.model });
                } else if (sql.includes("SELECT * FROM reviews WHERE model = ? and user = ?")) {
                    return callback(null, null);
                }
            });
            //jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
            //    return callback(null, { model: testReview.model });
            //});
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.deleteReviewsOfProduct(testReview.model)).rejects.toThrow(Error);
        });
    });
    describe("deleteAllReviews test cases",()=>{  
        test("It should delete all reviews", async () => {
            reviewdao = new ReviewDAO();
            const Run = jest.spyOn(db, "run").mockImplementationOnce((sql, callback) => {
                return callback(null);
            });
            await expect(reviewdao.deleteAllReviews()).resolves.toBeUndefined();
            expect(Run).toHaveBeenCalledTimes(1);
          });
        test("It should handle database error", async () => {
            reviewdao = new ReviewDAO();
            jest.spyOn(db, "run").mockImplementation((sql, callback) => {
                return callback(new Error("Database error"));
            });
            await expect(reviewdao.deleteAllReviews()).rejects.toThrow(Error);
          });
    });
});