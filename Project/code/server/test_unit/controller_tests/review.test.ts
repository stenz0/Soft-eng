import { test, expect, jest, afterEach} from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import { Role, User } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"

jest.mock("../../src/dao/reviewDAO")

afterEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
})

const testUser = new User("testcust", "testname", "testsurname", Role.CUSTOMER, "testaddress", "testbirthdate")
const testReview = {
    model: "Alexa",
    user: testUser,
    date: "testdate",
    score: 3,
    comment: "testcomment"
}

describe("ReviewController unit testing", () => {
    describe("addReview method", () => {
        test("IT should add a review", async () => {
            jest.spyOn(ReviewDAO.prototype, "addReview").mockResolvedValueOnce()
            const controller = new ReviewController()
            await controller.addReview(testReview.model, testReview.user, testReview.score, testReview.comment)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(testReview.model, testReview.user, testReview.score, testReview.comment)
        })
    })

    describe("getProductReviews method", () => {
        test("It should return reviews of a product", async () => {
            const mockReviews = [new ProductReview(testReview.model,testReview.user.username,testReview.score,testReview.date,testReview.comment)]
            jest.spyOn(ReviewDAO.prototype, "getProductReviews").mockResolvedValueOnce(mockReviews)
            const controller = new ReviewController()
            const response = await controller.getProductReviews(testReview.model)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1);
            expect(response).toEqual(mockReviews)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(testReview.model)
        })
    })

    describe("deleteReview method", () => {
        test("It should delete a user's review of a product", async () => {
            jest.spyOn(ReviewDAO.prototype, "deleteReview").mockResolvedValueOnce()
            const controller = new ReviewController()
            await controller.deleteReview(testReview.model, testReview.user)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(testReview.model, testReview.user)
        })
    })

    describe("deleteReviewsOfProduct method", () => {
        test("It should delete all reviews of a product", async () => {
            jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct").mockResolvedValueOnce()
            const controller = new ReviewController()
            await controller.deleteReviewsOfProduct(testReview.model)
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1);
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(testReview.model)
        })
    })

    describe("deleteAllReviews method", () => {
        test("It should delete all reviews", async () => {
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviews").mockResolvedValueOnce()
            const controller = new ReviewController()
            await controller.deleteAllReviews()
            expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1);
        })
    })
})
