/**
 * @copyright Copyright (c) 2017 Arawa
 *
 * @author 2021 Baptiste Fotia <baptiste.fotia@arawa.fr>
 * @author 2021 Cyrille Bollu <cyrille@bollu.be>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import { deleteBlankSpacename } from './spaceService.js'
import { generateUrl } from '@nextcloud/router'
import AddGroupToGroupfolderError from '../Errors/Groupfolders/AddGroupToGroupfolderError.js'
import AddGroupToManageACLForGroupfolderError from '../Errors/Groupfolders/AddGroupToManageACLForGroupfolderError.js'
import axios from '@nextcloud/axios'
import BadGetError from '../Errors/BadGetError.js'
import CheckGroupfolderNameExistError from '../Errors/Groupfolders/CheckGroupfolderNameError.js'
import CreateGroupfolderError from '../Errors/Groupfolders/BadCreateError.js'
import EnableAclGroupfolderError from '../Errors/Groupfolders/EnableAclGroupfolderError.js'
import GetGroupfolderError from '../Errors/Groupfolders/GetGroupfolderError.js'
import NotificationError from './Notifications/NotificationError.js'
import RemoveGroupToManageACLForGroupfolderError from '../Errors/Groupfolders/RemoveGroupToManageACLForGroupfolderError.js'

/**
 * @return {object}
 */
export function getAll() {
	const data = axios.get(generateUrl('/apps/groupfolders/folders'))
		.then(resp => {
			if (resp.data.ocs.meta.status === 'ok') {
				return resp.data.ocs.data
			}
		})
		.catch(error => {
			throw new BadGetError('Error to get all spaces', error.reason)
		})
	return data
}

/**
 *
 * @param {number} groupfolderId it's the id of a groupfolder
 * @param {object} vueInstance it's an instance of vue
 * @return {Promise}
 * @throws {GetGroupfolderError}
 */
export function get(groupfolderId, vueInstance = undefined) {
	return axios.get(generateUrl(`/apps/groupfolders/folders/${groupfolderId}`))
		.then(resp => {
			if (resp.data.ocs.meta.status === 'ok') {
				const workspace = resp.data.ocs.data
				return workspace
			} else {
				throw new GetGroupfolderError('Impossible to get the groupfolder. May be an error network ?')
			}
		})
		.catch((error) => {
			const toastErrorToGetGroupfolder = new NotificationError(vueInstance)
			toastErrorToGetGroupfolder.push({
				title: t('workspace', 'Error to get the groupfolder'),
				text: t('workspace', error.message),
			})
			throw new Error(error.message)
		})
}

/**
 *
 * @param {object} space it's an object relative to space
 * @return {Promise}
 */
export function formatGroups(space) {
	const data = axios.post(generateUrl('/apps/workspace/api/workspace/formatGroups'), { workspace: space })
		.then(resp => {
			return resp
		})
		.catch(error => {
			console.error('Error POST to format space\'s groups', error)
		})
	return data
}

/**
 *
 * @param {object} space it's an object relative to space
 * @return {Promise}
 */
export function formatUsers(space) {
	const data = axios.post(generateUrl('/apps/workspace/api/workspace/formatUsers'), { workspace: space })
		.then(resp => {
			return resp
		})
		.catch(error => {
			console.error('Error POST to format space\'s users', error)
		})
	return data
}

/**
 * @param {string} spaceName it's the name of space to check
 * @param {object} vueInstance it's the instance of vue
 * @return {Promise}
 * @throws {CheckGroupfolderNameExistError}
 */
export function checkGroupfolderNameExist(spaceName, vueInstance = undefined) {
	return getAll()
		.then(groupfolders => {
			for (const folderId in groupfolders) {
				if (spaceName.toLowerCase() === groupfolders[folderId].mount_point.toLowerCase()) {
					throw new CheckGroupfolderNameExistError('The groupfolder with this name : ' + spaceName + ' already exist')
				}
			}
		})
		.catch((error) => {
			if (typeof (vueInstance) !== 'undefined') {
				const toastSpaceOrGroupfoldersExisting = new NotificationError(vueInstance)
				toastSpaceOrGroupfoldersExisting.push({
					title: t('workspace', 'Error - Creating space'),
					text: t(
						'workspace',
						'This space or groupfolder already exist. Please, input another space.'
						+ '\nIf "toto" space exist, you cannot create the "tOTo" space.'
						+ '\nMake sure you the groupfolder doesn\'t exist.',
					),
					duration: 6000,
				})
			}
			throw new CheckGroupfolderNameExistError(error)
		})
}

/**
 * @param {number} folderId from a groupfolder
 * @return {Promise}
 * @throws {EnableAclGroupfolderError}
 */
export function enableAcl(folderId) {
	return axios.post(generateUrl(`/apps/groupfolders/folders/${folderId}/acl`),
		{
			acl: 1,
		})
		.then(resp => {
			if (resp.status === 200 && resp.data.ocs.meta.status === 'ok') {
				return resp.data.ocs.data
			}

			if (resp.status === 500) {
				throw new Error('Groupfolders\' API doesn\'t enable ACL. May be a problem with the connection ?')
			}
		})
		.catch(error => {
			throw new EnableAclGroupfolderError(error.message)
		})
}

/**
 * @param {number} folderId of an groupfolder
 * @param {string} gid it's an id (string format) of a group
 * @param {object} vueInstance it's an instance of vue
 * @return {Promise}
 * @throws {AddGroupToGroupfolderError}
 */
export function addGroupToGroupfolder(folderId, gid, vueInstance = undefined) {
	return axios.post(generateUrl(`/apps/groupfolders/folders/${folderId}/groups`),
		{
			group: gid,
		})
		.then(resp => {
			return resp.data.ocs.data
		})
		.catch(error => {
			if (typeof typeof (vueInstance) !== 'undefined') {
				const toastErrorToAddGroupToGroupfolder = new NotificationError(vueInstance)
				toastErrorToAddGroupToGroupfolder.push({
					title: t('workspace', 'Error groups'),
					text: t('workspace', 'Impossible to attach the {error} group to groupfolder. May be a problem with the connection ?', { error }),
				})
			}
			console.error(`Impossible to attach the ${gid} group to groupfolder. May be a problem with the connection ?`, error)
			throw new AddGroupToGroupfolderError('Error to add Space Manager group in the groupfolder')
		})
}

/**
 * @param {number} folderId it's an id of a groupfolder
 * @param {string} gid it's an id (string format) of a group
 * @param {object} vueInstance it's an instance of vue
 * @return {Promise}
 * @throws {AddGroupToManageACLForGroupfolderError}
 */
export function addGroupToManageACLForGroupfolder(folderId, gid, vueInstance) {
	return axios.post(generateUrl(`/apps/groupfolders/folders/${folderId}/manageACL`),
		{
			mappingType: 'group',
			mappingId: gid,
			manageAcl: true,
		})
		.then(resp => {
			return resp.data.ocs.data
		})
		.catch(error => {
			if (typeof (vueInstance) !== 'undefined') {
				const toastErrorToAddGroupToManageACLForGroupfolder = new NotificationError(vueInstance)
				toastErrorToAddGroupToManageACLForGroupfolder.push({
					title: t('workspace', 'Error to add group as manager acl'),
					text: t('workspace', 'Impossible to add the Space Manager group in Manage ACL groupfolder'),
				})
			}
			console.error('Impossible to add the Space Manager group in Manage ACL groupfolder', error)
			throw new AddGroupToManageACLForGroupfolderError('Error to add the Space Manager group in manage ACL groupfolder')
		})
}

/**
 * @param {number} folderId it's an id of a groupfolder
 * @param {string} gid it's an id (string format) of a group
 * @param {object} vueInstance it's an instance of vue
 * @return {Promise}
 * @throws {RemoveGroupToManageACLForGroupfolderError}
 */
export function removeGroupToManageACLForGroupfolder(folderId, gid, vueInstance) {
	return axios.post(generateUrl(`/apps/groupfolders/folders/${folderId}/manageACL`),
		{
			mappingType: 'group',
			mappingId: gid,
			manageAcl: false
		})
		.then(resp => {
			return resp.data.ocs.data
		})
		.catch(error => {
			if (typeof (vueInstance) !== 'undefined') {
				const toastErrorToRemoveGroupToManageACLForGroupfolder = new NotificationError(vueInstance)
				toastErrorToRemoveGroupToManageACLForGroupfolder.push({
					title: t('workspace', 'Error to remove group as manager acl'),
					text: t('workspace', 'Impossible to remove the group from the advanced permissions.'),
				})
			}
			console.error('Impossible to remove the group from the advanced permissions.', error)
			throw new RemoveGroupToManageACLForGroupfolderError('Impossible to remove the group from the advanced permissions.')
		})
}

/**
 * @param {string} spaceName it's the name space to create
 * @param {object} vueInstance it's the instance of vue
 * @return {Promise}
 * @throws {CreateGroupfolderError}
 */
export function createGroupfolder(spaceName, vueInstance = undefined) {
	return axios.post(generateUrl('/apps/groupfolders/folders'),
		{
			mountpoint: spaceName,
		})
		.then(resp => {
			if (resp.data.ocs.meta.statuscode !== 100) {
				throw new Error('Impossible to create a groupfolder. May be an error network ?')
			}
			return resp.data.ocs
		})
		.catch(error => {
			if (error instanceof Error) {
				if (typeof (vueInstance) !== 'undefined') {
					const toastErrorCreateGroupfolder = new NotificationError(vueInstance)
					toastErrorCreateGroupfolder.push({
						title: t('workspace', 'Error to create'),
						text: t('workspace', error.message),
					})
				}
				throw new Error(error.message)
			}
			if (typeof (vueInstance) !== 'undefined') {
				const toastErrorNetworking = new NotificationError(vueInstance)
				toastErrorNetworking.push({
					title: t('workspace', 'Network error'),
					text: t('workspace', 'A network error occured while trying to create the workspaces.'),
				})
			}
			throw new CreateGroupfolderError('Network error - the error is: ' + error)
		})
}

/**
 * @param {object} workspace it's an object relative to workspace
 * @return {Promise}
 */
export function destroy(workspace) {
	// It's possible to send data with the DELETE verb adding `data` key word as
	// second argument in the `delete` method.
	const result = axios.delete(generateUrl('/apps/workspace/api/delete/space'),
		{
			data: {
				workspace,
			},
		})
		.then(resp => {
			if (resp.status === 200) {
				// delete groupfolders
				axios.delete(generateUrl(`/apps/groupfolders/folders/${workspace.groupfolderId}`))
					.then(resp => {
						if (!resp.data.ocs.meta.status === 'ok') {
							console.error('Error to delete this groupfolder', workspace)
						}
					})
					.catch(error => {
						console.error('Error to delete a groupfolder. May be a problem network ?', error)
					})
			}
			return resp.data
		})
	return result
}

/**
 *
 * @param {object} workspace it's the object relative to workspace
 * @param {string} newSpaceName it's the new name for the workspace
 * @return {Promise}
 */
export function rename(workspace, newSpaceName) {
	// Response format to return
	const respFormat = {
		data: {},
	}
	respFormat.data.statuscode = 500
	respFormat.data.message = 'Rename the space is impossible.'

	if (!checkGroupfolderNameExist(workspace.name)) {
		respFormat.data.statuscode = 409
		respFormat.data.message = 'The space name already exist. We cannot rename with this name.'
		console.error('The groupfolder name already exist. Please, choose another name to rename your space.')
		return respFormat
	}
	newSpaceName = deleteBlankSpacename(newSpaceName)
	// Update space side
	const workspaceUpdated = axios.patch(generateUrl('/apps/workspace/api/space/rename'),
		{
			workspace,
			newSpaceName,
		})
		.then(resp => {
			// If space is updated...
			if (resp.data.statuscode === 204) {
				const space = resp.data.space
				// ... the groupfolder is updating
				const groupfolderUpdated = axios.post(generateUrl(`/apps/groupfolders/folders/${space.groupfolder_id}/mountpoint`),
					{
						mountpoint: space.space_name,
					})
					.then(resp => {
						return resp
					})
					.catch(error => {
						console.error('Error to call Groupfolder\'s API', error)
					})
				return groupfolderUpdated
			}

			if (resp.data.statuscode === 400) {
				respFormat.data.statuscode = 400
				respFormat.data.space = null
				respFormat.data.groups = null
				respFormat.data.message = resp.data.message
				return respFormat
			}
		})
		.catch(error => {
			console.error('Problem to rename the space', error)
		})
	const respFormatFinal = workspaceUpdated
		.then(resultat => {

			if (!Object.prototype.hasOwnProperty.call(resultat.data, 'ocs')) {
				if (resultat.data.statuscode === 400) {
					return resultat
				}
			}

			if (resultat.data.ocs.data.success) {
				respFormat.data.statuscode = 204
				respFormat.data.space = newSpaceName
				respFormat.data.groups = workspace.groups
				respFormat.data.message = 'Space and Groupfolder are updated both side.'
				return respFormat
			}
		})
		.catch(error => {
			console.error('Problem to format the object when renamed the space name', error)
		})
	return respFormatFinal
}
