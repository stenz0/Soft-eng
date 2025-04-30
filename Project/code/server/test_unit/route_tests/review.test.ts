import { test, expect, jest,afterEach,beforeEach } from "@jest/globals"
import request from "supertest"
import { app } from "../../index"
import {Role, User} from "../../src/components/user"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import ReviewController from "../../src/controllers/reviewController"
import { ProductReview } from "../../src/components/review";
import { ProductNotFoundError } from "../../src/errors/productError";
import { NoReviewProductError, ExistingReviewError } from "../../src/errors/reviewError";
import {UnauthorizedUserError} from "../../src/errors/userError";


const baseURL = "/ezelectronics"

//jest.mock("../../src/helper")
//jest.mock("../../src/components/review")
jest.mock("../../src/routers/auth")

const dummyMiddleware = (req: any, res: any, next: any) => next()

beforeEach(()=>{
    jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation(dummyMiddleware)
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation(dummyMiddleware)
})

afterEach(()=>{
    jest.resetAllMocks()
    jest.clearAllMocks()
})

const testuser1=new User("testcust","testname1","testsurname1",Role.CUSTOMER,"testaddress1","testbirthdate1")
const testreview1 = new ProductReview("iPhone20",testuser1.username,3,"testdate1","testcomment1")
const testreview2 = {
    model: "iPhone20",
    user: new User("testcust2", "testname2", "testsurname2", Role.CUSTOMER, "testaddress2", "testbirthdate2"), // User object
    date: "testdate2",
    score: 3,
    comment: "testcomment2"
}
        //Example of a unit test for the POST ezelectronics/reviews/:model route
        //The test checks if the route returns a 200 success code
        //The test also expects the createUser method of the controller to be called once with the correct parameters
test("It should return a 200 success code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "addReview").mockResolvedValueOnce() //Mock the addReview method of the controller
    const response = await request(app).post(baseURL +"/reviews/iPhone20").send({ score: testreview2.score, comment: testreview2.comment });
    expect(response.status).toBe(200) //Check if the response status is 200
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) //Check if the addReview method has been called once
    
})
test("It should return a 404 status code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValue(new ProductNotFoundError()); //Mock the addReview method of the controller
    const response = await request(app).post(baseURL +"/reviews/notexisting").send({ score: testreview2.score, comment: testreview2.comment });
    expect(response.status).toBe(404) //Check if the response status is 404
    expect(response.body.error).toBe("Product not found");
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) //Check if the addReview method has been called once
})
test("It should return a 409 status code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValue(new ExistingReviewError()); //Mock the addReview method of the controller
    const response = await request(app).post(baseURL +"/reviews/iPhone20").send({ score: testreview2.score, comment: testreview2.comment });
    expect(response.status).toBe(409) //Check if the response status is 404
    expect(response.body.error).toBe("You have already reviewed this product");
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1) //Check if the addReview method has been called once
})
//Example of a unit test for the GET ezelectronics/reviews/:model route
test("It should return a 200 success code", async () => {
    jest.spyOn(ReviewController.prototype, "getProductReviews").mockResolvedValueOnce([testreview1]);
    const response = await request(app).get(baseURL +"/reviews/iPhone20");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([testreview1]);
    expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1);
});
test("It should return a 401 status code", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => 
        {res.status(401).json({ error: "Unauthenticated user", status: 401})});
    jest.spyOn(ReviewController.prototype, "getProductReviews").mockRejectedValue(new UnauthorizedUserError());
    const response = await request(app).get(baseURL +"/reviews/iPhone20");
    expect(response.status).toBe(401);
    expect(response.body.error).toEqual("Unauthenticated user");
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
});
//Example of a unit test for the  DELETE ezelectronics/reviews/:model route
test("It should return a 200 success code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteReview").mockResolvedValue();
    const response = await request(app).delete(baseURL +"/reviews/iPhone20");
    expect(response.status).toBe(200);
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
});
test("It should return a 404 status code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValue(new ProductNotFoundError());
    const response = await request(app).delete(baseURL +"/reviews/notexisting");
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual("Product not found");
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
});
test("It should return a 404 status code", async () => {
    jest.spyOn(Authenticator.prototype,"isCustomer").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteReview").mockRejectedValue(new NoReviewProductError());
    const response = await request(app).delete(baseURL +"/reviews/iPhone20");
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual("You have not reviewed this product");
    expect(Authenticator.prototype.isCustomer).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1);
});
//Example of a unit test for the  DELETE ezelectronics/reviews/:model/all route
test("It should return a 200 success code", async () => {
    jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockResolvedValue();
    const response = await request(app).delete(baseURL +"/reviews/iPhone20/all");
    expect(response.status).toBe(200);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
});
test("It should return a 404 status code", async () => {
    jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct").mockRejectedValue(new ProductNotFoundError());
    const response = await request(app).delete(baseURL +"/reviews/notexisting/all");
    expect(response.status).toBe(404);
    expect(response.body.error).toEqual("Product not found");
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
});
//Example of a unit test for the  DELETE ezelectronics/reviews route
test("It should return a 200 success code", async () => {
    jest.spyOn(Authenticator.prototype,"isAdminOrManager").mockImplementation((req,res,next)=>next());
    jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockResolvedValue();
    const response = await request(app).delete(baseURL +"/reviews");
    expect(response.status).toBe(200);
    expect(Authenticator.prototype.isAdminOrManager).toHaveBeenCalledTimes(1);
    expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
});
test("It should return a 401 status code", async () => {
    jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
        res.status(401).json({ error: "Unauthorized user" });
    });
    jest.spyOn(ReviewController.prototype, "deleteAllReviews").mockRejectedValueOnce(false)
    const response = await request(app).delete(baseURL +"/reviews");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized user");
    expect(Authenticator.prototype.isLoggedIn).toHaveBeenCalledTimes(1);
});