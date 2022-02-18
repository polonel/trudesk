import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import Log from '../../logger'
import axios from 'axios'
import { fetchNotices, unloadNotices } from 'actions/notices'

import PageTitle from 'components/PageTitle'
import PageContent from 'components/PageContent'
import Table from 'components/Table'
import TableHeader from 'components/Table/TableHeader'
import TableCell from 'components/Table/TableCell'
import TableRow from 'components/Table/TableRow'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'

import helpers from 'lib/helpers'

class NoticeContainer extends React.Component {
  constructor (props) {
    super(props)
  }

  componentDidMount () {
    this.props.fetchNotices()
  }

  componentWillUnmount () {
    this.props.unloadNotices()
  }

  onActiveNotice (noticeId) {}

  render () {
    const tableItems = this.props.notices.map(notice => {
      const formattedDate =
        helpers.formatDate(notice.get('date'), helpers.getShortDateFormat()) +
        ', ' +
        helpers.formatDate(notice.get('date'), helpers.getTimeFormat())
      return (
        <TableRow key={notice.get('_id')} className={'vam nbb'} clickable={false}>
          <TableCell>
            <div></div>
          </TableCell>
          <TableCell style={{ fontWeight: 500, padding: '18px 5px' }}>{notice.get('name')}</TableCell>
          <TableCell style={{ padding: '18px 5px' }}>{notice.get('message')}</TableCell>
          <TableCell style={{ padding: '18px 5px' }}>{formattedDate}</TableCell>
          <TableCell style={{ padding: '20px 15px' }}>
            <span style={{ display: 'block', width: 15, height: 15, backgroundColor: notice.get('color') }} />
          </TableCell>
          <TableCell>
            <ButtonGroup>
              <Button
                icon={'check'}
                style={'primary'}
                small={true}
                waves={true}
                onClick={() => this.onActiveNotice(notice.get('_id'))}
              />
            </ButtonGroup>
          </TableCell>
        </TableRow>
      )
    })
    return (
      <div>
        <PageTitle title={'Notices'} shadow={false} />
        <PageContent padding={0} paddingBottom={0} extraClass={'uk-position-relative'}>
          <Table
            style={{ margin: 0 }}
            extraClass={'pDataTable'}
            stickyHeader={true}
            striped={true}
            headers={[
              <TableHeader key={0} width={45} height={50} text={''} />,
              <TableHeader key={1} width={'20%'} text={'Name'} />,
              <TableHeader key={2} width={'60%'} text={'Message'} />,
              <TableHeader key={3} width={'10%'} text={'Date'} />,
              <TableHeader key={4} width={50} height={50} text={''} />,
              <TableHeader key={5} width={100} text={''} />
            ]}
          >
            {!this.props.loading && this.props.notices.size < 1 && (
              <TableRow clickable={false}>
                <TableCell colSpan={10}>
                  <h5 style={{ margin: 10 }}>No Notices Found</h5>
                </TableCell>
              </TableRow>
            )}
            {tableItems}
          </Table>
        </PageContent>
      </div>
    )
  }
}

NoticeContainer.propTypes = {
  notices: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,

  fetchNotices: PropTypes.func.isRequired,
  unloadNotices: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  notices: state.noticesState.notices,
  loading: state.noticesState.loading
})

export default connect(mapStateToProps, {
  fetchNotices,
  unloadNotices
})(NoticeContainer)
