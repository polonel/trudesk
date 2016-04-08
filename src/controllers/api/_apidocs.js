// This file contains old documentation blocks for API Versioning.


//Updated in 0.1.7 to Soft Delete
/**
 * @api {delete} /api/v1/users/:username Delete User
 * @apiName deleteUser
 * @apiDescription Deletes the giving user via username
 * @apiVersion 0.1.0
 * @apiGroup User
 * @apiHeader {string} accesstoken The access token for the logged in user
 * @apiExample Example usage:
 * curl -X DELETE -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/users/:username
 *
 * @apiSuccess {boolean}     success    Was the user successfully deleted.
 *
 *
 * @apiError InvalidRequest The request was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */