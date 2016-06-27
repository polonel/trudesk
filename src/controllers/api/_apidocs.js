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

//Updated in 0.1.7 to show for timespan
/**
 * @api {get} /api/v1/tickets/count/topgroups/:topNum Top Groups Count
 * @apiName getTopTicketGroups
 * @apiDescription Gets the group with the top ticket count
 * @apiVersion 0.1.5
 * @apiGroup Ticket
 * @apiHeader {string} accesstoken The access token for the logged in user
 *
 * @apiExample Example usage:
 * curl -H "accesstoken: {accesstoken}" -l http://localhost/api/v1/tickets/count/topgroups/10
 *
 * @apiSuccess {array} items Array with Group name and Count
 *
 * @apiError InvalidPostData The data was invalid
 * @apiErrorExample
 *      HTTP/1.1 400 Bad Request
 {
     "error": "Invalid Request"
 }
 */