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
 *  Updated:    3/30/19 12:15 AM
 *  Copyright (c) 2014-2019. All rights reserved.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { fetchDepartments, deleteDepartment } from 'actions/departments'
import { showModal } from 'actions/common'

import PageTitle from 'components/PageTitle'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'
import PageContent from 'components/PageContent'

import UIKit from 'uikit'
import helpers from 'lib/helpers'

class DepartmentsContainer extends React.Component {
  componentDidMount () {
    this.props.fetchDepartments()
  }

  onCreateDepartmentClick () {
    this.props.showModal('CREATE_DEPARTMENT')
  }

  onEditDepartmentClick (department) {
    this.props.showModal('EDIT_DEPARTMENT', { department })
  }

  onDeleteDepartmentClick (_id) {
    UIKit.modal.confirm(
      `<h2>Are you sure?</h2>
        <p style="font-size: 15px;">
            <span class="uk-text-danger" style="font-size: 15px;">This is a permanent action.</span> 
        </p>
        <p style="font-size: 12px;">
            Agents may lose access to resources once this department is deleted.
        </p>
        `,
      () => {
        this.props.deleteDepartment({ _id })
      },
      {
        labels: { Ok: 'Yes', Cancel: 'No' },
        confirmButtonClass: 'md-btn-danger'
      }
    )
  }

  render () {
    return (
      <div>
        <PageTitle
          title={'Departments'}
          shadow={false}
          rightComponent={
            <div className={'uk-grid uk-grid-collapse'}>
              <div className={'uk-width-1-1 mt-15 uk-text-right'}>
                <Button
                  text={'Create'}
                  flat={false}
                  small={true}
                  waves={false}
                  extraClass={'hover-accent'}
                  onClick={() => this.onCreateDepartmentClick()}
                />
              </div>
            </div>
          }
        />
        <PageContent padding={0}>
          <table className={'uk-table uk-table-striped sticky-header fixed-width'}>
            <thead>
              <tr>
                {/*<th style={{ width: 50, height: 50, verticalAlign: 'middle' }} />*/}
                <th
                  style={{
                    width: '35%',
                    verticalAlign: 'middle',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    padding: '8px 8px 8px 27px'
                  }}
                >
                  Name
                </th>
                <th style={{ verticalAlign: 'middle', fontSize: 12, textTransform: 'uppercase' }}>Teams</th>
                <th style={{ width: '25%', verticalAlign: 'middle', fontSize: 12, textTransform: 'uppercase' }}>
                  Groups
                </th>
                <th
                  style={{
                    width: 220,
                    verticalAlign: 'middle',
                    fontSize: 12,
                    textTransform: 'uppercase'
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={'scrollable full-height'}>
              {this.props.departments &&
                this.props.departments.map(department => {
                  const teams = department.get('teams')
                  const groups = department.get('groups')
                  return (
                    <tr key={department.get('_id')}>
                      {/*<td style={{ padding: '17px 18px', verticalAlign: 'middle' }}>*/}
                      {/*  <input*/}
                      {/*    type='checkbox'*/}
                      {/*    id={'c_' + department.get('_id')}*/}
                      {/*    style={{ display: 'none' }}*/}
                      {/*    className='svgcheckinput'*/}
                      {/*  />*/}
                      {/*  <label htmlFor={'c_' + department.get('_id')} className='svgcheck'>*/}
                      {/*    <svg width='16px' height='16px' viewBox='0 0 18 18'>*/}
                      {/*      <path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z' />*/}
                      {/*      <polyline points='1 9 7 14 15 4' />*/}
                      {/*    </svg>*/}
                      {/*  </label>*/}
                      {/*</td>*/}
                      <td style={{ verticalAlign: 'middle', padding: '8px 8px 8px 26px' }}>
                        <div style={{ fontWeight: '500' }}>{department.get('name')}</div>
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {teams &&
                          teams.map(team => {
                            return (
                              <div key={team.get('_id')} style={{ marginBottom: 4 }}>
                                {team.get('name')}
                              </div>
                            )
                          })}
                      </td>
                      <td style={{ verticalAlign: 'middle' }}>
                        {department.get('allGroups') === true && (
                          <div>
                            <h6 className={'text-success'} style={{ fontWeight: 'bold' }}>
                              All Groups
                            </h6>
                          </div>
                        )}
                        {department.get('publicGroups') === true && (
                          <div>
                            <h6 className={'text-success'} style={{ fontWeight: 'bold' }}>
                              All Public Groups
                            </h6>
                          </div>
                        )}
                        {department.get('allGroups') !== true &&
                          groups &&
                          groups.map(group => {
                            return (
                              <div key={group.get('_id')} style={{ marginBottom: 4 }}>
                                {group.get('name')}
                              </div>
                            )
                          })}
                      </td>
                      <td>
                        <ButtonGroup>
                          {helpers.canUser('departments:update', true) && (
                            <Button
                              text={'Edit'}
                              small={true}
                              waves={true}
                              onClick={() => this.onEditDepartmentClick(department)}
                            />
                          )}
                          {helpers.canUser('departments:delete', true) && (
                            <Button
                              text={'Delete'}
                              style={'danger'}
                              small={true}
                              waves={true}
                              onClick={() => this.onDeleteDepartmentClick(department.get('_id'))}
                            />
                          )}
                        </ButtonGroup>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </PageContent>
      </div>
    )
  }
}

DepartmentsContainer.propTypes = {
  departments: PropTypes.object.isRequired,
  fetchDepartments: PropTypes.func.isRequired,
  deleteDepartment: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  departments: state.departmentsState.departments
})

export default connect(
  mapStateToProps,
  { fetchDepartments, deleteDepartment, showModal }
)(DepartmentsContainer)
