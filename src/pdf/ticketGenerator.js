/*
 *       .                             .o8                     oooo
 *    .o8                             "888                     `888
 *  .o888oo oooo d8b oooo  oooo   .oooo888   .ooooo.   .oooo.o  888  oooo
 *    888   `888""8P `888  `888  d88' `888  d88' `88b d88(  "8  888 .8P'
 *    888    888      888   888  888   888  888ooo888 `"Y88b.   888888.
 *    888 .  888      888   888  888   888  888    .o o.  )88b  888 `88b.
 *    "888" d888b     `V88V"V8P' `Y8bod88P" `Y8bod8P' 8""888P' o888o o888o
 *  ========================================================================
 *  Author:     Chris Brame
 *  Updated:    2/20/22 2:42 PM
 *  Copyright (c) 2014-2022. All rights reserved.
 */

var path = require('path')
var PDFDocument = require('pdfkit')

var moment = require('moment-timezone')
var marked = require('marked')
var convert = require('html-to-text').convert

class TicketPDFGenerator {
  constructor (ticket) {
    this.ticket = ticket
    this.beginningOfPage = 50
    this.endOfPage = 550
  }

  generateHeaders (doc) {
    doc
      .image(path.resolve(__dirname, '../../public/img/defaultLogoDark.png'), 50, 50, { width: 128 })
      .fillColor('#000')
      .fontSize(20)
      .text('Ticket', 275, 50, { align: 'right' })
      .fontSize(10)
      .text('Ticket Number:   ' + this.ticket.uid, { align: 'right' })
      .text('Group:   ' + this.ticket.group.name, { align: 'right' })
      .text('Due Date:   ' + moment(this.ticket.dueDate).format('MM-DD-YYYY'), { align: 'right' })
      .text('Priority:   ' + this.ticket.priority.name, { align: 'right' })
      .text('Type:   ' + this.ticket.type.name, { align: 'right' })

    doc
      .moveTo(this.beginningOfPage, 150)
      .lineTo(this.endOfPage, 150)
      .stroke('#bbb')
  }

  generateIssue (doc) {
    var ownerImage = this.ticket.owner.image ? this.ticket.owner.image : 'defaultProfile.jpg'
    doc
      .circle(65, 190, 15)
      .save()
      .clip()
      .image(path.resolve(__dirname, '../../public/uploads/users/' + ownerImage), 50, 175, { width: 30 })
      .restore()

    doc
      .fontSize(12)
      .text(this.ticket.subject, 100, 177)
      .fontSize(9)
      .fill('#0000ff')
      .text(this.ticket.owner.fullname + ' <' + this.ticket.owner.email + '>', 100, doc.y + 5)
      .fill('#000')
      .text(moment(this.ticket.date).format('MM-DD-YYYY HH:mm:ss'))
      .moveDown(2)

    var markedIssue = marked.parse(this.ticket.issue)
    var images = []
    var converted = convert(markedIssue, {
      wordwrap: 200,
      formatters: {
        image: function (elm, walk, builder, formatOptions) {
          images.push({
            elm: elm
          })
        }
      }
    })

    doc.fontSize(10).text(converted, 50, doc.y)

    if (images.length > 0) {
      doc
        .fontSize(14)
        .text('\n')
        .text('Images')
      for (var i = 0; i < images.length; i++) {
        var elm = images[i].elm
        doc.image(elm.attribs.src, { width: elm.attribs.width })
      }
    }

    doc
      .moveDown()
      .moveTo(this.beginningOfPage, doc.y)
      .lineTo(this.endOfPage, doc.y)
      .stroke('#ccc')
      .moveDown(2)
  }

  generateComments (doc) {
    var comments = this.ticket.comments
    doc
      .fontSize(14)
      .text('Comments')
      .moveDown()

    if (comments.length < 1) doc.fontSize(11).text('No Comments')
    else {
      for (var i = 0; i < comments.length; i++) {
        var comment = comments[i]

        var ownerImage = comment.owner.image ? comment.owner.image : 'defaultProfile.jpg'
        doc
          .circle(65, doc.y + 15, 15)
          .save()
          .clip()
          .image(path.resolve(__dirname, '../../public/uploads/users/' + ownerImage), 50, doc.y, { width: 30 })
          .restore()

        doc
          .fontSize(12)
          .text('RE: ' + this.ticket.subject, 100, doc.y - 30)
          .fontSize(9)
          .fill('#0000ff')
          .text(comment.owner.fullname + ' <' + comment.owner.email + '>', 100, doc.y + 5)
          .fill('#000')
          .text(moment(this.ticket.date).format('MM-DD-YYYY HH:mm:ss'))

        doc.moveDown(2)

        var markedComment = marked.parse(comment.comment)
        var images = []
        var converted = convert(markedComment, {
          wordwrap: 200,
          formatters: {
            image: function (elm, walk, builder, formatOptions) {
              images.push({
                elm: elm
              })
            }
          }
        })

        doc.fontSize(10).text(converted)

        doc
          .moveDown()
          .moveTo(this.beginningOfPage, doc.y)
          .lineTo(this.endOfPage, doc.y)
          .stroke('#ddd')
          .moveDown(2)
      }
    }

    doc
      .moveDown()
      .moveTo(this.beginningOfPage, doc.y)
      .lineTo(this.endOfPage, doc.y)
      .stroke('#bbb')
      .moveDown(2)
  }

  generateTicketHistory (doc) {
    var history = this.ticket.history
    doc.addPage()
    this.generateHeaders(doc)
    doc
      .moveDown(4)
      .fontSize(14)
      .text('Ticket History', 50)
      .moveDown()

    if (history.length < 1) doc.text('No History')
    else {
      for (var i = 0; i < history.length; i++) {
        var item = history[i]
        doc
          .fontSize(10)
          .text('Action by: ..... ' + item.owner.fullname)
          .text('Date: ............ ' + moment(item.date).format('MM-DD-YYYY HH:mm:ss'))
          .moveDown()
          .text(item.description)

        doc
          .moveDown()
          .moveTo(this.beginningOfPage, doc.y)
          .lineTo(this.endOfPage, doc.y)
          .stroke('#bbb')
          .moveDown(2)
      }
    }
  }

  generate (callback) {
    var filename = 'Ticket#' + this.ticket.uid + '.pdf'
    var theOutput = new PDFDocument({ bufferPages: true })
    var buffers = []
    var obj = {}
    theOutput.on('data', buffers.push.bind(buffers))
    theOutput.on('end', function () {
      var pdfData = Buffer.concat(buffers)
      obj.headers = {
        'Content-Length': Buffer.byteLength(pdfData),
        'Content-Type': 'application/pdf',
        'Content-disposition': 'attachment;filename=' + filename
      }
      obj.data = pdfData

      return callback(null, obj)
    })

    theOutput.on('error', function (err) {
      return callback(err)
    })

    this.generateHeaders(theOutput)
    theOutput.moveDown()
    this.generateIssue(theOutput)
    this.generateComments(theOutput)
    this.generateTicketHistory(theOutput)

    theOutput.end()
  }
}

module.exports = TicketPDFGenerator
